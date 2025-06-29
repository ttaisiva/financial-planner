// 2. Run income events, adding the income to the cash investment.
// a. The amount of this income event in the previous year needs to be stored and updated based on the
// expected annual change in amount, because the expected annual change can be sampled from a
// probability distribution, and the sampling is done each year.
// b. If the inflation-adjustment flag is set, adjust the amount for inflation.
// c. If user or their spouse is dead, omit their percentage of the amount.
// d. Add the income to the cash investment.
// e. Update running total curYearIncome,
// f. Update running total curYearSS of social security benefits, if income type = social security.

import { sample } from "./preliminaries.js";
import { getUserBirthYear, getUserLifeExpectancy } from "./monte_carlo_sim.js";
import { logIncome } from "../logging.js";
import { pool } from "../utils.js";

/**
 * Processes an income event and updates financial data.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {object} previousYearAmounts - The amount from the previous year.
 * @param {number} inflationRate - The inflation rate.
 * @param {boolean} isUserAlive - Whether the user is alive.
 * @param {boolean} isSpouseAlive - Whether the spouse is alive.
 * @param {number} cashInvestment - The current cash investment.
 * @param {number} curYearIncome - The current year's income total.
 * @param {number} curYearSS - The current year's social security total.
 * @returns {Object} The updated financial data.
 */
export async function process_income_event(
  scenarioId,
  previousYearAmounts,
  inflationRate,
  isUserAlive,
  isSpouseAlive,
  runningTotals,
  currentSimulationYear,
  incomeEventsStart,
  incomeEventsDuration,
  evtlog
) {
  const incomeEvents = await getIncomeEvents(
    scenarioId,
    previousYearAmounts,
    incomeEventsStart,
    incomeEventsDuration,
    currentSimulationYear
  );

  if (incomeEvents.length === 0) {
    console.warn(
      `No income events found for scenario ID ${scenarioId}. Skipping income event processing.`
    );
    return; // Return early if no income events found
  }

  let activeIncomeEvents = [];
  for (const event of incomeEvents) {
    if (
      !isActiveIncomeEvent(
        event.id,
        currentSimulationYear,
        incomeEventsStart,
        incomeEventsDuration
      )
    ) {
      continue; // Skip inactive events
    }

    // Apply annual change to the previous year's amount
    let currentAmount = 0;
    let prevAmount = previousYearAmounts[event.id] || 0;

    if (event.changeAmtOrPct === "percent") {
      const sampledChange = sample(event.changeDistribution);

      const percentageChange = (prevAmount * sampledChange) / 100; // Calculate percentage change

      currentAmount = Number(previousYearAmounts[event.id]) + percentageChange;
    } else {
      const sampledChange = sample(event.changeDistribution);
      currentAmount =
        Number(previousYearAmounts[event.id]) + Number(sampledChange);
    }

    // Apply inflation adjustment
    if (event.inflationAdjusted) {
      currentAmount *= 1 + inflationRate;
      currentAmount = Math.round(currentAmount * 100) / 100;
      event.adjustedAmount = currentAmount;
    }

    if (!isUserAlive) {
      const userPortion = Number(event.userFraction) * currentAmount;
      currentAmount -= userPortion;
      currentAmount = Math.round(currentAmount * 100) / 100;
    }
    if (!isSpouseAlive) {
      const spousePortion = (1 - Number(event.userFraction)) * currentAmount;
      currentAmount -= spousePortion;
      // console.log(
      //   "Spouse is dead. Removed spouse portion. Adjusted amount to: ",
      //   currentAmount
      // );
    }

    event.adjustedAmount = Math.round(currentAmount * 100) / 100; // Store adjusted amount in the event object

    // Add to cash investment and income totals
    runningTotals.cashInvestment =
      Number(runningTotals.cashInvestment) + Number(currentAmount);
    runningTotals.curYearIncome =
      Number(runningTotals.curYearIncome) + Number(currentAmount);
    logIncome(evtlog, currentSimulationYear, event.name, currentAmount);

    activeIncomeEvents.push(event);

    if (event.isSocialSecurity) {
      runningTotals.curYearSS =
        Number(runningTotals.curYearSS) + Number(currentAmount);
    }

    activeIncomeEvents.push(event);

    previousYearAmounts[event.id] = currentAmount;
  }

  runningTotals.incomes = activeIncomeEvents; // Store active income events in running totals
}

/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {Object} previousYearAmounts - An object mapping event IDs to their previous year amounts.
 * @returns {Array} The calculated data for the income events.
 */
export async function getIncomeEvents(
  scenarioId,
  previousYearAmounts,
  incomeEventsStart,
  incomeEventsDuration,
  currentSimulationYear
) {
  const [rows] = await pool.execute(
    `SELECT 
            id,
            scenario_id,
            name,
            start,
            duration,
            change_distribution,
            change_amt_or_pct,
            inflation_adjusted, 
            initial_amount, 
            user_fraction, 
            social_security,
            change_amt_or_pct,
            user_fraction
         FROM events 
         WHERE scenario_id = ? AND type = 'income'`,
    [scenarioId]
  );

  if (rows.length === 0) {
    return [];
  }

  return rows.map((event) => {
    const prevAmount = previousYearAmounts[event.id] || 0;

    return {
      id: event.id,
      name: event.name,
      initialAmount: event.initial_amount,
      changeDistribution: event.change_distribution,
      inflationAdjusted: event.inflation_adjusted || false,
      isSocialSecurity: event.social_security || false,
      changeAmtOrPct: event.change_amt_or_pct || "percent",
      userFraction: event.user_fraction || 1,
      start: event.start,
      duration: event.duration,
    };
  });
}

/**
 * Extracts the start year of an event.
 * @param {Object} event - The event object containing the start year definition.
 * @returns {number} The calculated start year.
 */
export function getEventStartYear(event) {
  const start = event.start;

  switch (start.type) {
    case "fixed":
      return Math.round(start.value);

    case "normal":
      return Math.round(sample(start));

    case "uniform":
      return Math.round(sample(start));

    case "startWith":
      return getEventStartYearFromSeries(start.eventSeries);

    case "startAfter":
      if (!start.eventSeries) {
        throw new Error(
          `Missing eventSeries for startAfter type: ${JSON.stringify(start)}`
        );
      }
      const referencedEndYear = getEventEndYearFromSeries(start.eventSeries);
      return referencedEndYear + 1;

    default:
      throw new Error(`Unsupported start type: ${start.type}`);
  }
}

/**
 * Placeholder function to fetch the start year of a referenced event series.
 * Replace this with the actual implementation to fetch the event series data.
 * @param {string} eventSeries - The name of the referenced event series.
 * @returns {number} The start year of the referenced event series.
 */
function getEventStartYearFromSeries(eventSeries) {
  const currentYear = new Date().getFullYear();
  return currentYear;
}

/**
 * Placeholder function to fetch the end year of a referenced event series.
 * Replace this with the actual implementation to fetch the event series data.
 * @param {string} eventSeries - The name of the referenced event series.
 * @returns {number} The end year of the referenced event series.
 */
export async function getEventEndYearFromSeries(eventSeries) {
  console.warn(`Fetching end year for event series: ${eventSeries}`);
  const userBirthYear = Number(await getUserBirthYear(scenarioId));
  const userLifeExpectancy = Number(await getUserLifeExpectancy(scenarioId));

  const userLifespan = userBirthYear + userLifeExpectancy;

  return userLifespan;
}

/**
 * Extracts the duration of an event.
 * @param {Object} event - The event object containing the duration definition.
 * @returns {number} The calculated duration.
 */
export function getEventDuration(event) {
  if (!event.duration || !event.duration.type) {
    throw new Error(
      `Invalid event duration definition: ${JSON.stringify(event.duration)}`
    );
  }

  const duration = event.duration;

  switch (duration.type) {
    case "fixed":
      return Math.round(duration.value);

    case "normal":
      return Math.max(0, Math.round(sample(duration)));

    case "uniform":
      return Math.max(0, Math.round(sample(duration)));

    default:
      throw new Error(`Unsupported duration type: ${duration.type}`);
  }
}

/**
 * Determines if an income event is active based on its start year, duration, and the current simulation year.
 * @param {number} eventId - The ID of the income event.
 * @param {number} currentSimulationYear - The current simulation year.
 * @param {Object} incomeEventsStart - An object mapping event IDs to their start years.
 * @param {Object} incomeEventsDuration - An object mapping event IDs to their durations.
 * @returns {boolean} True if the event is active, false otherwise.
 */
function isActiveIncomeEvent(
  eventId,
  currentSimulationYear,
  incomeEventsStart,
  incomeEventsDuration
) {
  const startYear = incomeEventsStart[eventId];
  const duration = incomeEventsDuration[eventId];

  // Check if the event starts in the future
  if (startYear > currentSimulationYear) {
    return false;
  }

  // Check if the event's duration has ended
  if (startYear + duration <= currentSimulationYear) {
    return false;
  }

  // console.log(`Event ID: ${eventId} is active.`);
  return true;
}
