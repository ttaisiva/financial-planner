import { process_income_event } from "./run_income_events.js";
import { run_preliminaries, sample } from "./preliminaries.js";
import { performRMDs } from "./perform_rmds.js";
import { getIncomeEvents } from "./run_income_events.js";
import { updateInvestments } from "./update_investments.js";
import { runRothOptimizer } from "./roth_optimizer.js";
import { payNondiscExpenses } from "./nondisc_expenses.js";
import { payDiscExpenses } from "./disc_expenses.js";
import { getRothYears } from "./roth_optimizer.js";
import { getRothStrategy } from "./roth_optimizer.js";
import { getInvestEvents, runInvestEvent } from "./run_invest_event.js";

import { log } from "../logging.js";
import { ensureConnection, connection } from "../server.js";
import { generateNormalRandom, generateUniformRandom } from "../utils.js";
/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export async function simulation(date, numSimulations, userId, scenarioId) {
  console.log("Running Monte Carlo simulation...");

  await ensureConnection();
  const totalYears = await getTotalYears(date, scenarioId, connection);

  const simulationResults = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    await ensureConnection();
    console.log("Running simulation number: ", sim);
    let yearlyResults = {};
    let previousYearAmounts = {}; // Placeholder for previous year amounts for income events
    let isUserAlive = true;
    let isSpouseAlive = true;

    // let cashInvestment = await getCashInvest(scenarioId);
    let cashInvestment = 1100; // dani using to test

    let curYearIncome = 0;
    let curYearSS = 0;
    const incomeEvents = await getIncomeEvents(scenarioId, []); // Fetch income events to determine the number of events
    const rothYears = await getRothYears(scenarioId);
    let rothStrategy = await getRothStrategy(scenarioId); // to avoid repetitive fetching in loop

    console.log("Initializing simulation investments.");
    let investments = await initInvestments(scenarioId); // Initialize investments for the scenario

    let investEventYears = await getInvestEvents(scenarioId);

    let afterTaxContributionLimit = await getAfterTaxLimit(scenarioId);

    //Step 0: run preliminaries -> need to further implement this
    const inflationRate = await run_preliminaries(scenarioId);

    console.log("Total years for simulation: ", totalYears);
    for (let year = 0; year < totalYears; year++) {
      //years in which the simulation is  being run

      const currentSimulationYear = date + year; //actual year being simulated
      console.log("current year", currentSimulationYear);

      //   console.log(
      //     "Inflation rate for year ",
      //     currentSimulationYear,
      //     " is: ",
      //     inflationRate
      //   );

      if (year === 0) {
        // Populate the object with initial amounts based on event IDs
        if (incomeEvents.length === 0) {
          console.log("No income events found for this scenario.");
        } else {
          incomeEvents.forEach((event) => {
            previousYearAmounts[event.id] = event.initialAmount || 0; // Use initialAmount or default to 0
            console.log(
              "Previous year amounts for income events: ",
              previousYearAmounts
            );
          });
        }
      }

      // Step 1: Run income events
      //   let updatedAmounts;
      //   ({ updatedAmounts, cashInvestment, curYearIncome, curYearSS } =
      //     await process_income_event(
      //       scenarioId,
      //       previousYearAmounts,
      //       inflationRate,
      //       isUserAlive,
      //       isSpouseAlive,
      //       cashInvestment,
      //       curYearIncome,
      //       curYearSS
      //     ));

      //   Step 2: Perform required minimum distributions (RMDs) -> round these to nearest hundredth
      //   console.log("Perform RMDs for year: ", currentSimulationYear);
      //   ({ curYearIncome } = await performRMDs(
      //     scenarioId,
      //     currentSimulationYear,
      //     curYearIncome,
      //     investments
      //   ));

      //   Step 3: Optimize Roth conversions
      //   if (
      //     rothYears &&
      //     currentSimulationYear >= rothYears.start_year &&
      //     currentSimulationYear <= rothYears.end_year
      //   ) {
      //     console.log(
      //       `Roth conversion optimizer enabled for years ${rothYears.start_year}-${rothYears.end_year}.`
      //     );
      //     const rothResult = await runRothOptimizer(
      //       scenarioId,
      //       rothStrategy,
      //       incomeEvents,
      //       investments
      //     );
      //     investments = rothResult.investments;
      //     rothStrategy = rothResult.rothStrategy;
      //   } else {
      //     console.log(
      //       `Roth conversion optimizer disabled for year ${currentSimulationYear}, skipping step 3.`
      //     );
      //   }

      // Step 4: Update investments
      //({ curYearIncome } = await updateInvestments(scenarioId, curYearIncome, investments));

      // Pay non-discretionary expenses
      //payNondiscExpenses(scenarioId);

      // Pay discretionary expenses
      //payDiscExpenses(scenarioId);

      // Step 9: Invest Events
      await runInvestEvent(
        currentSimulationYear,
        scenarioId,
        investEventYears,
        cashInvestment,
        investments,
        inflationRate,
        afterTaxContributionLimit,
        date
      );

      //   console.log("updated investments after invest event:", investments);

      // Step 10: Rebalance investments

      // Collect yearly results -> need to impelemnt this
      //   yearlyResults.push({
      //     year: currentSimulationYear,
      //     cash_flow: 0,
      //     investments: 0,
      //   });
    }

    if (sim == 0) log(userId, yearlyResults);
    simulationResults.push(yearlyResults);
  }

  return calculateStats(simulationResults); // Calculate median, mean, and other statistics
}

/**
 * Calculates the total number of years for the simulation based on the user's and spouse's lifespans.
 * @param {number} date - starting year of simulation
 * @param {Object} scenario - The scenario object containing user and spouse details.
 * @returns {number} The total number of years for the simulation.
 */
export async function getTotalYears(date, scenarioId) {
  //   console.log("Date: ", date);
  await ensureConnection();
  const userBirthYear = Number(await getUserBirthYear(scenarioId, connection));
  //   console.log("User birth year: ", userBirthYear);
  const userLifeExpectancy = Number(
    await getUserLifeExpectancy(scenarioId, connection)
  );
  //   console.log("User life expectancy: ", userLifeExpectancy);

  const userLifespan = userBirthYear + userLifeExpectancy;
  //   console.log("User lifespan: ", userLifespan);

  return userLifespan - date;
}

/**
 * Placeholder for calculating statistics from the simulation results.
 */
export function calculateStats(simulationResults) {
  console.log("Calculating statistics from simulation results");
  return {
    median: 0,
    mean: 0,
    otherInfo: {},
  };
}

async function initInvestments(scenarioId) {
  console.log("Fetching user-defined investments for the scenario.");
  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT 
            id,
            investment_type as type,
            value as value,
            tax_status as taxStatus
        
         FROM investments
         WHERE scenario_id = ?`,
    [scenarioId]
  );
  //   console.log("Simulation investments initialized.", rows);
  return rows;
}

export async function getUserBirthYear(scenarioId) {
  if (connection) {
    const query = `SELECT birth_years FROM scenarios WHERE id = ?`;
    try {
      const [results] = await connection.execute(query, [scenarioId]);
      console.log("results", [results]);
      return results[0]?.birth_years[0] || 0; // Return the birth year or 0 if not found
    } catch (error) {
      console.error("Error fetching user birth year:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  }
  return 0; // Return 0 if connection is not available
}

export async function getUserLifeExpectancy(scenarioId) {
  if (connection) {
    const query = `SELECT 
            life_expectancy
            FROM scenarios WHERE id = ?`;
    try {
      const [results] = await connection.execute(query, [scenarioId]);
      console.log("results: ", results);
      return sample(results[0].life_expectancy[0]);
    } catch (error) {
      console.error("Error fetching user life expectancy:", error);
      throw error; // Re-throw the error for the caller to handle
    }
  }
  return 0; // Return 0 if connection is not available
}

export async function getFilingStatus(scenarioId) {
  console.log("Fetching filing status from the database...");
  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT 
        marital_status
        FROM scenarios
        WHERE id = ?`,
    [scenarioId]
  );
  return rows[0].marital_status;
}

async function getCashInvest(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT * FROM investments WHERE scenario_id = ? AND investment_type = 'cash'",
    [scenarioId]
  );

  return rows[0].value;
}

async function getAfterTaxLimit(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT after_tax_contribution_limit FROM scenarios WHERE id = ?",
    [scenarioId]
  );

  //   console.log("after tax cont limit:", rows[0].after_tax_contribution_limit);

  return rows[0].value;
}
