// 2. Run income events, adding the income to the cash investment.
// a. The amount of this income event in the previous year needs to be stored and updated based on the
// expected annual change in amount, because the expected annual change can be sampled from a
// probability distribution, and the sampling is done each year.
// b. If the inflation-adjustment flag is set, adjust the amount for inflation.
// c. If user or their spouse is dead, omit their percentage of the amount.
// d. Add the income to the cash investment.
// e. Update running total curYearIncome,
// f. Update running total curYearSS of social security benefits, if income type = social security.

import { connection, ensureConnection } from "../server.js";
import { sample } from "./preliminaries.js";

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
  cashInvestment,
  curYearIncome,
  curYearSS
) {
  console.log(`Processing income events for scenario ID: ${scenarioId}`);
  console.log(
    `Initial cash investment: ${cashInvestment}, curYearIncome: ${curYearIncome}, curYearSS: ${curYearSS}`
  );

  // Get all income events and calculate current amounts
  const incomeEvents = await getIncomeEvents(scenarioId, previousYearAmounts);

  if (incomeEvents.length === 0) {
    console.warn(
      `No income events found for scenario ID ${scenarioId}. Skipping income event processing.`
    );
    return {
      updatedAmounts: {},
      cashInvestment,
      curYearIncome,
      curYearSS,
    };
  }

  console.log(
    `Found ${incomeEvents.length} income events for scenario ID ${scenarioId}.`
  );

  const updatedAmounts = {}; // To store currentAmount for each event

  for (const event of incomeEvents) {
    console.log(
      `Processing income event ID: ${event.id}, current Amount: ${event.currentAmount}`
    );

    let adjustedAmount = event.currentAmount;

    // Apply inflation adjustment
    if (event.inflationAdjusted) {
      adjustedAmount *= 1 + inflationRate;
      console.log(
        `Applied inflation adjustment. New adjustedAmount: ${adjustedAmount}`
      );
    }

    // Omit user or spouse portion if they are dead
    if (!isUserAlive) {
      const userPortion = (event.userPercentage / 100) * event.currentAmount;
      adjustedAmount -= userPortion;
      console.log(
        `User is not alive. Omitted user portion: ${userPortion}. New adjustedAmount: ${adjustedAmount}`
      );
    }
    if (!isSpouseAlive) {
      const spousePortion =
        (event.spousePercentage / 100) * event.currentAmount;
      adjustedAmount -= spousePortion;
      console.log(
        `Spouse is not alive. Omitted spouse portion: ${spousePortion}. New adjustedAmount: ${adjustedAmount}`
      );
    }

    // Add to cash investment and income totals
    cashInvestment += adjustedAmount;
    curYearIncome += adjustedAmount;

    console.log(
      `Added adjustedAmount to cashInvestment and curYearIncome. Updated cashInvestment: ${cashInvestment}, curYearIncome: ${curYearIncome}`
    );

    if (event.isSocialSecurity) {
      curYearSS += adjustedAmount;
      console.log(
        `Added adjustedAmount to curYearSS. Updated curYearSS: ${curYearSS}`
      );
    }

    updatedAmounts[event.id] = event.currentAmount; // Save the pre-adjusted amount
  }

  console.log(
    `Finished processing income events for scenario ID ${scenarioId}.`
  );
  console.log(
    `Final cashInvestment: ${cashInvestment}, curYearIncome: ${curYearIncome}, curYearSS: ${curYearSS}`
  );

  return {
    updatedAmounts,
    cashInvestment,
    curYearIncome,
    curYearSS,
  };
}

/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {Object} previousYearAmounts - An object mapping event IDs to their previous year amounts.
 * @returns {Array} The calculated data for the income events.
 */
export async function getIncomeEvents(scenarioId, previousYearAmounts) {
  console.log(`Fetching income events for scenario ID: ${scenarioId}`);
  await ensureConnection();

  const [rows] = await connection.execute(
    `SELECT 
            id,
            scenario_id,
            change_distribution,
            change_amt_or_pct,
            inflation_adjusted, 
            initial_amount, 
            user_fraction, 
            social_security
         FROM events 
         WHERE scenario_id = ? AND type = 'income'`,
    [scenarioId]
  );

  console.log("rows", rows)
  

  if (rows.length === 0) {
    console.warn(`No income events found for scenario ID ${scenarioId}.`);
    return []; // Return an empty array
  }

  

  return rows.map((event) => {
    const prevAmount = previousYearAmounts[event.id] || 0;
    console.log(
      `Calculating current amount for event ID: ${event.id}, previousYearAmount: ${prevAmount}`
    );

    const sampledChange = sample(event.change_distribution);

    console.log(`Sampled change for event ID: ${event.id}: ${sampledChange}`);

    const currentAmount = Number(prevAmount) + Number(sampledChange);
    console.log(
      `Calculated currentAmount for event ID: ${event.id}: ${currentAmount}`
    );

    return {
      id: event.id,
      initialAmount: event.initial_amount,
      currentAmount,
      inflationAdjusted: event.inflation_adjusted || false,
      userPercentage: event.user_percentage || 0,
      spousePercentage: event.spouse_percentage || 0,
      isSocialSecurity: event.is_social_security || false,
    };
  });
}
