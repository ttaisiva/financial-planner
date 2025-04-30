import { process_income_event } from "./run_income_events.js";
import { run_preliminaries, sample } from "./preliminaries.js";
import { performRMDs } from "./perform_rmds.js";
import {
  getIncomeEvents,
  getEventStartYear,
  getEventDuration,
} from "./run_income_events.js";
import { updateInvestments } from "./update_investments.js";
import { runRothOptimizer } from "./roth_optimizer.js";
import { payNonDiscExpenses } from "./nondisc_expenses.js";
import { payTaxes } from "./pay_prev_year_tax.js";
import { payDiscExpenses } from "./disc_expenses.js";
import { getRothYears } from "./roth_optimizer.js";
import { getRothStrategy } from "./roth_optimizer.js";
import { getInvestEvents, runInvestEvent } from "./run_invest_event.js";
import { initLogs } from "../logging.js";
import { logResults } from "../logging.js";
import { ensureConnection, connection } from "../server.js";
import { generateNormalRandom, generateUniformRandom } from "../utils.js";
import {
  getRebalanceEvents,
  runRebalanceEvents,
} from "./run_rebalance_events.js";
/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export async function simulation(date, numSimulations, userId, scenarioId) {
  console.log("RUNNING Monte Carlo simulation.");
  const logs = await initLogs(userId); // open log files for writing

  await ensureConnection();
  const totalYears = await getTotalYears(date, scenarioId, connection);

  const simulationResults = [];
  const financialGoal = await getFinancialGoal(scenarioId);

  for (let sim = 0; sim < numSimulations; sim++) {
    await ensureConnection();
    console.log("Running simulation number: ", sim);
    let yearlyResults = [];
    let previousYearAmounts = {}; // Placeholder for previous year amounts for income events
    let incomeEventsStart = {};
    let incomeEventsDuration = {};

    let isUserAlive = true;
    let isSpouseAlive = true;

    let cashInvestment = await getCashInvest(scenarioId);

    let purchasePrices = await getPurchasePrices(scenarioId);

    let taxData = await getTaxData(scenarioId, date);

    let investments = await initInvestments(scenarioId); // Initialize investments for the scenario

    const runningTotals = {
      cashInvestment: cashInvestment,
      curYearIncome: 0,
      curYearSS: 0,
      curYearGains: 0,
      curYearEarlyWithdrawals: 0,
      purchasePrices: purchasePrices,
      investments: investments,
    };

    const incomeEvents = await getIncomeEvents(scenarioId, []);
    await populateYearsAndDuration(
      incomeEvents,
      incomeEventsStart,
      incomeEventsDuration
    ); // Populate years and duration for income events
    const rothYears = await getRothYears(scenarioId);
    let rothStrategy = await getRothStrategy(scenarioId); // to avoid repetitive fetching in loop

    console.log("Initializing simulation investments.");

    let investEventYears = await getInvestEvents(scenarioId);

    let afterTaxContributionLimit = await getAfterTaxLimit(scenarioId);

    let rebalanceEvents = await getRebalanceEvents(scenarioId);

    // log investments before any changes
    if (sim == 0)
      logResults(
        logs.csvlog,
        logs.csvStream,
        runningTotals.investments,
        date - 1
      );

    //Step 0: run preliminaries
    await ensureConnection();
    const inflationRate = await run_preliminaries(scenarioId);

    console.log("Total years for simulation: ", totalYears);
    for (let year = 0; year < totalYears; year++) {
      //years in which the simulation is  being run

      const currentSimulationYear = date + year; //actual year being simulated
      console.log("current year", currentSimulationYear);

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

      await process_income_event(
        scenarioId,
        previousYearAmounts,
        inflationRate,
        isUserAlive,
        isSpouseAlive,
        runningTotals,
        currentSimulationYear,
        incomeEventsStart,
        incomeEventsDuration,
        logs.evtlog
      );

      console.log(
        "Current year income after income events: ",
        runningTotals.curYearIncome
      );

      // Step 2: Perform required minimum distributions (RMDs) -> round these to nearest hundredth
      console.log("Perform RMDs for year: ", currentSimulationYear);
      await performRMDs(
        scenarioId,
        currentSimulationYear,
        runningTotals,
        logs.evtlog
      );
      console.log(
        "Current year income after perform RMDs: ",
        runningTotals.curYearIncome
      );

      //   Step 3: Optimize Roth conversions
      if (
        rothYears &&
        currentSimulationYear >= rothYears.start_year &&
        currentSimulationYear <= rothYears.end_year
      ) {
        console.log(
          `Roth conversion optimizer enabled for years ${rothYears.start_year}-${rothYears.end_year}.`
        );
        const rothResult = await runRothOptimizer(
          scenarioId,
          rothStrategy,
          incomeEvents,
          currentSimulationYear,
          logs.evtlog,
          runningTotals
        );
        investments = rothResult.resInvestments;
        rothStrategy = rothResult.rothStrategy;
      } else {
        console.log(
          `Roth conversion optimizer disabled for year ${currentSimulationYear}, skipping step 3.`
        );
      }

      // Step 4: Update investments
      await updateInvestments(scenarioId, runningTotals);
      console.log(
        "Current year income after update investments: ",
        runningTotals.curYearIncome
      );

      // Step 5: Pay non-discretionary expenses and taxes
      console.log(
        "Paying non discretionary expenses with cash: ",
        runningTotals.cashInvestment
      );
      const taxes = await payTaxes(
        runningTotals,
        scenarioId,
        incomeEvents,
        runningTotals,
        taxData
      );
      await payNonDiscExpenses(
        scenarioId,
        runningTotals,
        currentSimulationYear,
        inflationRate,
        date,
        taxes
      );

      // Step 6: Pay discretionary expenses
      console.log(
        "Cash investment before paying discretionary expenses: ",
        runningTotals.cashInvestment
      );
      await payDiscExpenses(
        scenarioId,
        runningTotals,
        currentSimulationYear,
        inflationRate,
        date
      );
      console.log(
        "Cash investment after paying discretionary expenses: ",
        runningTotals.cashInvestment
      );

      // Step 9: Invest Events
      await runInvestEvent(
        currentSimulationYear,
        scenarioId,
        investEventYears,
        runningTotals,
        inflationRate,
        afterTaxContributionLimit,
        date
      );
      console.log(
        "Cash Investment after running Invest Event:",
        runningTotals.cashInvestment
      );
      console.log("purchase prices after invest event:", purchasePrices);

      // Step 10: Rebalance investments
      // console.log("REBALANCE EVENTS: ", rebalanceEvents);
      // console.log("investments before rebalance: event", investments);
      await runRebalanceEvents(
        currentSimulationYear,
        rebalanceEvents,
        runningTotals
      );

      yearlyResults.push({
        year: currentSimulationYear,
        cashInvestment: runningTotals.cashInvestment,
        curYearIncome: runningTotals.curYearIncome,
        curYearSS: runningTotals.curYearSS,
        curYearGains: runningTotals.curYearGains,
        curYearEarlyWithdrawals: runningTotals.curYearEarlyWithdrawals,
        purchasePrices: runningTotals.purchasePrices,
        investments: runningTotals.investments,
      });

      if (sim == 0)
        logResults(
          logs.csvlog,
          logs.csvStream,
          runningTotals.investments,
          currentSimulationYear
        );
    }
    logs.csvlog.end(); // close the csv log file

    simulationResults.push(yearlyResults);
    console.log("**** SIMULATION END*****");
    console.log("Investments:", investments);
    console.log("Running Totals: ", runningTotals);
  }
  logs.evtlog.end(); // close the event log file

  const stats = calculateStats(simulationResults, financialGoal); // Calculate median, mean, and other statistics
  console.log("Returning stats: ", stats);
  return stats;
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
export function calculateStats(simulationResults, financialGoal) {
  console.log(
    "Calculating statistics from simulation results",
    simulationResults
  );

  // Flatten the yearly results into a single array of cash investments
  const allCashInvestments = simulationResults.flatMap((yearlyResults) =>
    yearlyResults.map((result) => result.cashInvestment)
  );
  console.log("all Cash investments: ", allCashInvestments);

  // Calculate mean
  const total = allCashInvestments.reduce((sum, value) => sum + value, 0);
  console.log("total: ", total);
  const mean = total / allCashInvestments.length;
  console.log("mean: ", mean);

  // Calculate median
  const sorted = [...allCashInvestments].sort((a, b) => a - b);
  console.log("sorted: ", sorted);
  const mid = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Calculate other statistics (e.g., min, max)
  const min = Math.min(...allCashInvestments);
  console.log("min: ", min);
  const max = Math.max(...allCashInvestments);
  console.log("max: ", max);

  console.log("Simulation Results to return: ", simulationResults);
  return {
    median,
    mean,
    min,
    max,
    financialGoal: financialGoal,
    totalSimulations: simulationResults.length,
    allSimulationResults: simulationResults,
  };
}

/**
 * Get investments from scenario in database
 * @param {int} scenarioId
 * @returns
 */
async function initInvestments(scenarioId) {
  console.log("Fetching user-defined investments for the scenario.");
  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT 
            id,
            investment_type as type,
            value,
            tax_status as taxStatus
        
         FROM investments
         WHERE scenario_id = ?`,
    [scenarioId]
  );
  //   console.log("Simulation investments initialized.", rows);
  return rows;
}

/**
 * Get user birth year from scenario in database
 * @param {int} scenarioId
 * @returns
 */
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

/**
 * Get user life expectancy from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getUserLifeExpectancy(scenarioId) {
  await ensureConnection();
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

/**
 * Get filing status from scenario in database
 * @param {int} scenarioId
 * @returns
 */
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

/**
 * Get cash investment value from scenario in database
 * @param {int} scenarioId
 * @returns
 */
async function getCashInvest(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT * FROM investments WHERE scenario_id = ? AND investment_type = 'cash'",
    [scenarioId]
  );

  return Number(rows[0].value);
}

/**
 * Get after tax contribution limit from scenario in database
 * @param {int} scenarioId
 * @returns
 */
async function getAfterTaxLimit(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT after_tax_contribution_limit FROM scenarios WHERE id = ?",
    [scenarioId]
  );

  //   console.log("after tax cont limit:", rows[0].after_tax_contribution_limit);

  return rows[0].value;
}

/**
 * Initialize purchase prices for investments from database
 * @param {*} scenarioId
 * @returns {investId: investValue, investId2: investValue2, ...}
 */
async function getPurchasePrices(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT id, value FROM investments WHERE scenario_id = ?",
    [scenarioId]
  );

  const investmentMap = rows.reduce((acc, row) => {
    acc[row.id] = row.value;
    return acc;
  }, {});

  return investmentMap;
}
/**
 * Populates the start years and durations for income events.
 * @param {Array} incomeEvents - Array of income event objects.
 * @param {Object} incomeEventsStart - Object to store start years for each event by ID.
 * @param {Object} eventsDurationStart - Object to store durations for each event by ID.
 */
export async function populateYearsAndDuration(
  incomeEvents,
  incomeEventsStart,
  incomeEventsDuration
) {
  console.log("Populating start years and durations for income events...");

  for (const event of incomeEvents) {
    console.log("events: ", event);
    console.log("event ID: ", event.id);
    console.log("income events start: ", incomeEventsStart);

    // Populate start year if not already calculated
    if (!incomeEventsStart[event.id]) {
      incomeEventsStart[event.id] = getEventStartYear(event);
      console.log(
        `Calculated start year for event ID ${event.id}: ${
          incomeEventsStart[event.id]
        }`
      );
    }

    // Populate duration if not already calculated
    if (!incomeEventsDuration[event.id]) {
      incomeEventsDuration[event.id] = getEventDuration(event);
      console.log(
        `Calculated duration for event ID ${event.id}: ${
          incomeEventsDuration[event.id]
        }`
      );
    }
  }

  console.log("Finished populating start years and durations.");
}

/**
 * Gets the tax brackets for the given scenario
 * @param scenarioID id of scenario
 * @param year initial year
 * @returns All tax brackets in an Object
 */
const getTaxData = async (scenarioID, year) => {
  await ensureConnection();
  console.log("scneerairo", scenarioID, year);
  // Get scenario
  const scnQuery = `
    SELECT * FROM scenarios
    WHERE id = ?
  `;
  const [scenario] = (await connection.execute(scnQuery, [scenarioID]))[0];
  console.log(scenario.marital_status);

  // Get federal income tax brackets
  const fedQuery = `
    SELECT * FROM tax_brackets
    WHERE year = ? AND filing_status = ?
  `;
  let [fedTaxBrackets] = await connection.execute(fedQuery, [
    year,
    scenario.marital_status,
  ]);
  if (fedTaxBrackets.length == 0) {
    await ensureConnection();
    const query = `
      SELECT * from tax_brackets
      WHERE filing_status = ? AND year = (SELECT MAX(YEAR) FROM tax_brackets)
    `;
    fedTaxBrackets = await connection.execute(query, [scenario.marital_status]);
    fedTaxBrackets = fedTaxBrackets[0];
  }

  // Get state income tax brackets
  const stateQuery = `
    SELECT * FROM state_tax_brackets
    WHERE year = ? AND filing_status = ? AND state = ?
  `;
  let [stateTaxBrackets] = await connection.execute(stateQuery, [
    year,
    scenario.marital_status,
    scenario.residence_state,
  ]);
  if (stateTaxBrackets.length == 0) {
    await ensureConnection();
    const query = `
      SELECT * from state_tax_brackets
      WHERE filing_status = ? AND state = ? AND year = (SELECT MAX(YEAR) FROM state_tax_brackets)
    `;
    stateTaxBrackets = await connection.execute(query, [
      scenario.marital_status,
      scenario.residence_state,
    ]);
    stateTaxBrackets = stateTaxBrackets[0];
  }

  // Get capital gains tax brackets
  const cptQuery = `
    SELECT * FROM capital_gains_tax
    WHERE year = ? AND filing_status = ?
  `;
  let [capitalTaxBrackets] = await connection.execute(cptQuery, [
    year,
    scenario.marital_status,
  ]);
  if (capitalTaxBrackets.length == 0) {
    await ensureConnection();
    const query = `
      SELECT * FROM capital_gains_tax
      WHERE filing_status = ? AND year = (SELECT MAX(YEAR) FROM capital_gains_tax)
    `;
    capitalTaxBrackets = await connection.execute(query, [
      scenario.marital_status,
    ]);
    capitalTaxBrackets = capitalTaxBrackets[0];
  }

  //Get deductions
  const deductionQuery = `
    SELECT * FROM standard_deductions
    WHERE filing_status = ? AND year = ?
  `;
  let [deductions] = await connection.execute(deductionQuery, [
    scenario.marital_status,
    year,
  ]);
  if (deductions.length == 0) {
    await ensureConnection();
    const query = `
      SELECT * FROM standard_deductions
      WHERE filing_status = ? and year = (SELECT MAX(YEAR) FROM standard_deductions)
    `;
    deductions = await connection.execute(query, [scenario.marital_status]);
    deductions = deductions[0];
  }

  const taxData = {
    federal: fedTaxBrackets,
    state: stateTaxBrackets,
    capital: capitalTaxBrackets,
    deduction: deductions,
  };
  return taxData;
};

/**
 * Fetches the financial goal for a given scenario.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {number|null} The financial goal amount or null if not found.
 */
async function getFinancialGoal(scenarioId) {
  await ensureConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT financial_goal FROM scenarios WHERE id = ?`,
      [scenarioId]
    );

    if (rows.length === 0) {
      console.log(`No financial goal found for scenario ID: ${scenarioId}`);
      return null; // Return null if no financial goal is found
    }

    const financialGoal = rows[0].financial_goal;
    console.log(
      `Financial goal for scenario ID ${scenarioId}: $${financialGoal}`
    );
    return financialGoal;
  } catch (error) {
    console.error("Error fetching financial goal:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}
