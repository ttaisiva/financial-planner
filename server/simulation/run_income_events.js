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
import { getUserBirthYear, getUserLifeExpectancy } from "./monte_carlo_sim.js";

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
export async function process_income_event(scenarioId, previousYearAmounts,inflationRate,isUserAlive,isSpouseAlive, runningTotals, currentSimulationYear, incomeEventsStart, incomeEventsDuration) {


  console.log(`Processing income events for scenario ID: ${scenarioId} with current simulation year: ${currentSimulationYear}`);
  console.log(
    `Initial cash investment: ${runningTotals.cashInvestment}, curYearIncome: ${runningTotals.curYearIncome}, curYearSS: ${runningTotals.curYearSS}`
  );


  // Get all income events and calculate current amounts
  const incomeEvents = await getIncomeEvents(scenarioId, previousYearAmounts, incomeEventsStart, incomeEventsDuration, currentSimulationYear);

  if (incomeEvents.length === 0) {
    console.warn(
      `No income events found for scenario ID ${scenarioId}. Skipping income event processing.`
    );
    return ;//{curYearIncome, cashInvestment, curYearSS}; // Return early if no income events found
  }

  console.log(
    `Found ${incomeEvents.length} income events for scenario ID ${scenarioId}.`
  );

  

  for (const event of incomeEvents) {
    const startYear = incomeEventsStart[event.id];
    console.log(`Event start year: ${startYear}, Current simulation year: ${currentSimulationYear}`);
    if(startYear > currentSimulationYear) {
        console.log(`Skipping event ID: ${event.id} as it starts in the future.`);
        continue;
    }
    const duration = incomeEventsDuration[event.id];
    console.log("Event duration: ", duration);
    if(startYear + duration <= currentSimulationYear) {
        console.log(`Skipping event ID: ${event.id} as its duration is over.`);
        continue;
    }

   
    
    // Apply expected annual change for active income events
    let currentAmount = 0;
    console.log("previous", previousYearAmounts[event.id]);
    if (event.changeAmtOrPct === "percent") {
        const sampledChange = sample(event.changeDistribution);
        const percentageChange = (prevAmount * sampledChange) / 100; // Calculate percentage change
        console.log(`Sampled percentage change for event ID: ${event.id}: ${percentageChange}`);
        currentAmount = Number(previousYearAmounts[event.id]) + percentageChange;
        console.log(`Calculated currentAmount for event ID: ${event.id}: ${currentAmount}`);
    } else {
        const sampledChange = sample(event.changeDistribution);
        console.log(`Sampled fixed change for event ID: ${event.id}: ${sampledChange}`);
        currentAmount = Number(previousYearAmounts[event.id]) + Number(sampledChange);
        console.log(`Calculated currentAmount for event ID: ${event.id}: ${currentAmount}`);
    }
    
    // Apply inflation adjustment
    if (event.inflationAdjusted) {
      currentAmount *= 1 + inflationRate;
      console.log(
        `Applied inflation adjustment. New adjustedAmount: ${currentAmount}`
      );
    }

    // Omit user or spouse portion if they are dead
    if (!isUserAlive) {
      const userPortion = (Number(event.userFraction) / 100) * currentAmount;
      currentAmount -= userPortion;
      console.log(`User is not alive. Omitted user portion: ${userPortion}. New adjustedAmount: ${currentAmount}`);
    }
    if (!isSpouseAlive) {
      const spousePortion =  ((1 - Number(event.spousePercentage)) / 100) * currentAmount;
      currentAmount -= spousePortion;
      console.log(`Spouse is not alive. Omitted spouse portion: ${spousePortion}. New adjustedAmount: ${currentAmount}`);
    }

    // Add to cash investment and income totals
    runningTotals.cashInvestment =  Number(runningTotals.cashInvestment) + Number(currentAmount);
    runningTotals.curYearIncome = Number(runningTotals.curYearIncome) + Number(currentAmount);
   

    console.log(
      `Added adjustedAmount to cashInvestment and curYearIncome. Updated cashInvestment: ${runningTotals.cashInvestment}, curYearIncome: ${runningTotals.curYearIncome}`
    );

    if (event.isSocialSecurity) {
        runningTotals.curYearSS = Number(runningTotals.curYearSS) + Number(currentAmount);
     
      console.log(`Added adjustedAmount to curYearSS. Updated curYearSS: ${runningTotals.curYearSS}`);
    }

    
    previousYearAmounts[event.id] = currentAmount;
    console.log(`Updated previousYearAmounts for event ID ${event.id}: ${currentAmount}`);
  }

  console.log(
    `Finished processing income events for scenario ID ${scenarioId}.`
  );
  console.log(
    `Final cashInvestment: ${runningTotals.cashInvestment}, curYearIncome: ${runningTotals.curYearIncome}, curYearSS: ${runningTotals.curYearSS}`
  );
  
}

/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {Object} previousYearAmounts - An object mapping event IDs to their previous year amounts.
 * @returns {Array} The calculated data for the income events.
 */
export async function getIncomeEvents(scenarioId, previousYearAmounts, incomeEventsStart, incomeEventsDuration, currentSimulationYear) {
  console.log(`Fetching income events for scenario ID: ${scenarioId}`);
  await ensureConnection();



  const [rows] = await connection.execute(
    `SELECT 
            id,
            scenario_id,
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

  console.log("rows", rows)
  

  if (rows.length === 0) {
    console.warn(`No income events found for scenario ID ${scenarioId}.`);
    return []; // Return an empty array
  }

  

  return rows.map((event) => {
    const prevAmount = previousYearAmounts[event.id] || 0;
    

    return {
      id: event.id,
      initialAmount: event.initial_amount,
      changeDistribution: event.change_distribution,
      inflationAdjusted: event.inflation_adjusted || false,
      userPercentage: event.user_percentage || 0,
      spousePercentage: event.spouse_percentage || 0,
      isSocialSecurity: event.is_social_security || false,
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
    console.log("event", event)


    const start = event.start;

    switch (start.type) {
        case "fixed":
            // Fixed start year
            return Math.round(start.value);

        case "normal":
            // Start year sampled from a normal distribution
            return Math.round(sample(start));

        case "uniform":
            // Start year sampled from a uniform distribution
            return Math.round(sample(start));

        case "startWith":
            // Start year is the same as another event series
            console.log("startWith", start.eventSeries)
            return getEventStartYearFromSeries(start.eventSeries);

        case "startAfter":
            // Start year is after another event series ends
            if (!start.eventSeries) {
                throw new Error(`Missing eventSeries for startAfter type: ${JSON.stringify(start)}`);
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
    console.warn(`Fetching start year for event series: ${eventSeries}`);
    // Replace with actual logic to fetch the start year of the referenced event series
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
    const userBirthYear = Number(await getUserBirthYear(scenarioId, connection));
    console.log("User birth year: ", userBirthYear);
    const userLifeExpectancy = Number(await getUserLifeExpectancy(scenarioId, connection));
    console.log("User life expectancy: ", userLifeExpectancy);
    
    const userLifespan = userBirthYear + userLifeExpectancy;

    return userLifespan; // Example placeholder value
}


/**
 * Extracts the duration of an event.
 * @param {Object} event - The event object containing the duration definition.
 * @returns {number} The calculated duration.
 */
export function getEventDuration(event) {
    if (!event.duration || !event.duration.type) {
        throw new Error(`Invalid event duration definition: ${JSON.stringify(event.duration)}`);
    }

    const duration = event.duration;

    switch (duration.type) {
        case "fixed":
            // Fixed duration
            return Math.round(duration.value);

        case "normal":
            // Duration sampled from a normal distribution
            return Math.max(0, Math.round(sample(duration))); // Ensure non-negative duration

        case "uniform":
            // Duration sampled from a uniform distribution
            return Math.max(0, Math.round(sample(duration))); // Ensure non-negative duration

        default:
            throw new Error(`Unsupported duration type: ${duration.type}`);
    }
}