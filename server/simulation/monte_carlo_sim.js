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
import {
  generateNormalRandom,
  generateUniformRandom,
  getEventYears,
  pool,
} from "../utils.js";
import {
  getRebalanceEvents,
  runRebalanceEvents,
} from "./run_rebalance_events.js";

/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export async function simulation(
  date,
  numSimulations,
  userId,
  scenarioId,
  dimParams
) {
  console.log(`Running ${numSimulations}simulation for scenario ${scenarioId}`);
  const logs = await initLogs(userId); // open log files for writing

  const totalYears = await getTotalYears(date, scenarioId);

  const simulationResults = [];
  const financialGoal = await getFinancialGoal(scenarioId);

  let yearlyResults = [];
  let previousYearAmounts = {}; // Placeholder for previous year amounts for income events
  let incomeEventsStart = {};
  let incomeEventsDuration = {};

  let spouseBirthYear = await getSpouseBirthYear(scenarioId);
  let spouseLifeExpect = await getSpouseLifeExpectancy(scenarioId);

  let spouseDeathYear = spouseBirthYear + spouseLifeExpect;


  let isUserAlive = true;
  let isSpouseAlive = true;

  let cashInvestment = await getCashInvest(scenarioId);

  let purchasePrices = await getPurchasePrices(scenarioId);

  let taxData = await getTaxData(scenarioId, date);

  let investments = await initInvestments(scenarioId); // Initialize investments for the scenario
  const incomeEvents = await getIncomeEvents(scenarioId, []);
  const expenseEvents = await getExpenseEvents(scenarioId);

  const runningTotals = {
    cashInvestment: cashInvestment,
    curYearIncome: 0,
    curYearSS: 0,
    curYearGains: 0,
    curYearEarlyWithdrawals: 0,
    purchasePrices: purchasePrices,
    investments: investments,
    expenses: [],
    incomes: [],
    taxes: [],
    actualDiscExpenses: [],
    maritalStatus: await getFilingStatus(scenarioId),
    incomeEvents: incomeEvents,
    expenseEvents: expenseEvents,
  };

  await populateYearsAndDuration(
    incomeEvents,
    incomeEventsStart,
    incomeEventsDuration
  ); // Populate years and duration for income events
  // need to do the same for expense events
  const rothYears = await getRothYears(scenarioId);
  let rothStrategy = await getRothStrategy(scenarioId); // to avoid repetitive fetching in loop

  let afterTaxContributionLimit = await getAfterTaxLimit(scenarioId);

  // populate years and durations for invest events
  let investEvents = await getInvestEvents(scenarioId);
  let investEventYears = await getEventYears(investEvents);

  // populate years and durations for rebalance events
  let rebalanceEvents = await getRebalanceEvents(scenarioId);
  let rebalanceEventYears = await getEventYears(rebalanceEvents);

  // log investments before any changes

  logResults(logs.csvlog, logs.csvStream, runningTotals.investments, date - 1);

  // **Update Event Fields Based on dimParams**
  updateEventFields(dimParams, {
    incomeEvents,
    investEventYears,
    rebalanceEvents,
  });

  for (let year = 0; year < totalYears; year++) {
    //years in which the simulation is  being run

    //Step 0: run preliminaries
    const inflationRate = await run_preliminaries(scenarioId);

    const currentSimulationYear = date + year; //actual year being simulated

    if (year === 0) {
      // Populate the object with initial amounts based on event IDs
      if (incomeEvents.length === 0) {
      } else {
        incomeEvents.forEach((event) => {
          previousYearAmounts[event.id] = event.initialAmount || 0; // Use initialAmount or default to 0
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

    // Step 2: Perform required minimum distributions (RMDs) -> round these to nearest hundredth
    await performRMDs(
      scenarioId,
      currentSimulationYear,
      runningTotals,
      logs.evtlog
    );

    //   Step 3: Optimize Roth conversions
    if (
      rothYears &&
      currentSimulationYear >= rothYears.start_year &&
      currentSimulationYear <= rothYears.end_year
    ) {
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
    }

    // Step 4: Update investments

    await updateInvestments(scenarioId, runningTotals);

    // Step 4.5: Handle spouse death
    if (isSpouseAlive) {
      // if spouse currently alive, check if death year is reached
      if (currentSimulationYear === spouseDeathYear) {
        isSpouseAlive = false;
      }

      // if spouse is dead, change marital status to single
      if (!isSpouseAlive) {

        // Change tax filing status to single
        runningTotals.maritalStatus = "single";
      }
    }

    // Step 5: Pay non-discretionary expenses and taxes
    const taxes = await payTaxes(
      runningTotals,
      scenarioId,
      incomeEvents,
      runningTotals,
      taxData,
    );
    // TODO LOG TAXES
    console.log("Taxes paid for the year:", taxes);
    if (taxes) {
      runningTotals.taxes.push(Number(taxes.toFixed(2))); // Store taxes for the year
    }

    await payNonDiscExpenses(
      scenarioId,
      runningTotals,
      currentSimulationYear,
      inflationRate,
      date,
      isSpouseAlive,
      taxes,
      logs.evtlog
    );

    //Step 6: Pay discretionary expenses
    await payDiscExpenses(
      scenarioId,
      runningTotals,
      currentSimulationYear,
      inflationRate,
      date,
      logs.evtlog
    );

    // Step 7: Invest Events
    await runInvestEvent(
      currentSimulationYear,
      scenarioId,
      investEventYears,
      runningTotals,
      inflationRate,
      afterTaxContributionLimit,
      date,
      logs.evtlog
    );

    // Step 8: Rebalance investments
    await runRebalanceEvents(
      currentSimulationYear,
      rebalanceEvents,
      rebalanceEventYears,
      runningTotals,
      logs.evtlog
    );

    yearlyResults.push({
      year: currentSimulationYear,
      cashInvestment: runningTotals.cashInvestment,
      curYearIncome: runningTotals.curYearIncome,
      curYearSS: runningTotals.curYearSS,
      curYearGains: runningTotals.curYearGains,
      curYearEarlyWithdrawals: runningTotals.curYearEarlyWithdrawals,
      purchasePrices: JSON.parse(JSON.stringify(runningTotals.purchasePrices)), // Deep copy
      investments: JSON.parse(JSON.stringify(runningTotals.investments)),
      expenses: JSON.parse(JSON.stringify(runningTotals.expenses)),
      incomes: JSON.parse(JSON.stringify(runningTotals.incomes)),
      taxes: JSON.parse(JSON.stringify(runningTotals.taxes)),
      actualDiscExpenses: JSON.parse(
        JSON.stringify(runningTotals.actualDiscExpenses)
      ),
    });


    logResults(
      logs.csvlog,
      logs.csvStream,
      runningTotals.investments,
      currentSimulationYear
    );

    runningTotals.actualDiscExpenses = []; // Reset actual discretionary expenses for the next year
    runningTotals.expenses = []; // Reset expenses for the next year
    runningTotals.incomes = []; // Reset incomes for the next year
    runningTotals.taxes = []; // Reset taxes for the next year
  }
  logs.csvlog.end(); // close the csv log file

  simulationResults.push(yearlyResults);

  logs.evtlog.end(); // close the event log file


  return simulationResults;
}

/**
 * Calculates the total number of years for the simulation based on the user's and spouse's lifespans.
 * @param {number} date - starting year of simulation
 * @param {Object} scenario - The scenario object containing user and spouse details.
 * @returns {number} The total number of years for the simulation.
 */
export async function getTotalYears(date, scenarioId) {
  const userBirthYear = Number(await getUserBirthYear(scenarioId));
  const userLifeExpectancy = Number(await getUserLifeExpectancy(scenarioId));

  const userLifespan = userBirthYear + userLifeExpectancy;

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

  const allCashInvestments = simulationResults
    .flat(2) // Flatten 3-level array to a flat list of yearly objects
    .map((result, i) => {
      const val = Number(result.cashInvestment);
      if (isNaN(val)) {
        console.warn(
          `Invalid cashInvestment at index ${i}:`,
          result.cashInvestment
        );
      }
      return val;
    })
    .filter((val) => !isNaN(val));


  // Calculate mean
  const total = allCashInvestments.reduce(
    (sum, value) => Number(sum) + Number(value),
    0
  );
  const mean = total / allCashInvestments.length;

  const sorted = [...allCashInvestments].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const min = Math.min(...allCashInvestments);
  const max = Math.max(...allCashInvestments);

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
  const [rows] = await pool.execute(
    `SELECT 
            id,
            investment_type as type,
            value,
            tax_status as taxStatus
        
         FROM investments
         WHERE scenario_id = ?`,
    [scenarioId]
  );
  return rows;
}

/**
 * Get user birth year from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getUserBirthYear(scenarioId) {
  const query = `SELECT birth_years FROM scenarios WHERE id = ?`;
  try {
    const [results] = await pool.execute(query, [scenarioId]);
    return results[0]?.birth_years[0] || 0; // Return the birth year or 0 if not found
  } catch (error) {
    console.error("Error fetching user birth year:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Get user life expectancy from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getUserLifeExpectancy(scenarioId) {
  const query = `SELECT 
            life_expectancy
            FROM scenarios WHERE id = ?`;
  try {
    const [results] = await pool.execute(query, [scenarioId]);
    return sample(results[0].life_expectancy[0]);
  } catch (error) {
    console.error("Error fetching user life expectancy:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Get spouse birth year from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getSpouseBirthYear(scenarioId) {
  const query = `SELECT birth_years FROM scenarios WHERE id = ?`;
  try {
    const [results] = await pool.execute(query, [scenarioId]);
    return results[0]?.birth_years[1] || 0; // Return the birth year or 0 if not found
  } catch (error) {
    console.error("Error fetching spouse birth year:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Get spouse life expectancy from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getSpouseLifeExpectancy(scenarioId) {
  const query = `SELECT 
            life_expectancy
            FROM scenarios WHERE id = ?`;
  try {
    const [results] = await pool.execute(query, [scenarioId]);
    return sample(results[0].life_expectancy[1]);
  } catch (error) {
    console.error("Error fetching spouse life expectancy:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Get filing status from scenario in database
 * @param {int} scenarioId
 * @returns
 */
export async function getFilingStatus(scenarioId) {
  const [rows] = await pool.execute(
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
  const [rows] = await pool.execute(
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
  const [rows] = await pool.execute(
    "SELECT after_tax_contribution_limit FROM scenarios WHERE id = ?",
    [scenarioId]
  );

  return rows[0].value;
}

/**
 * Initialize purchase prices for investments from database
 * @param {*} scenarioId
 * @returns {investId: investValue, investId2: investValue2, ...}
 */
async function getPurchasePrices(scenarioId) {
  const [rows] = await pool.execute(
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
  for (const event of incomeEvents) {
    if (!incomeEventsStart[event.id]) {
      incomeEventsStart[event.id] = getEventStartYear(event);
    }

    if (!incomeEventsDuration[event.id]) {
      incomeEventsDuration[event.id] = getEventDuration(event);
    }
  }
}

/**
 * Gets the tax brackets for the given scenario
 * @param scenarioID id of scenario
 * @param year initial year
 * @returns All tax brackets in an Object
 */
const getTaxData = async (scenarioID, year) => {
  // Get scenario
  const scnQuery = `
    SELECT * FROM scenarios
    WHERE id = ?
  `;
  const [scenario] = (await pool.execute(scnQuery, [scenarioID]))[0];

  const fedQuery = `
    SELECT * FROM tax_brackets
    WHERE year = ? AND filing_status = ?
  `;
  let [fedTaxBrackets] = await pool.execute(fedQuery, [
    year,
    scenario.marital_status,
  ]);
  if (fedTaxBrackets.length == 0) {
    const query = `
      SELECT * from tax_brackets
      WHERE filing_status = ? AND year = (SELECT MAX(YEAR) FROM tax_brackets)
    `;
    fedTaxBrackets = await pool.execute(query, [scenario.marital_status]);
    fedTaxBrackets = fedTaxBrackets[0];
  }

  const stateQuery = `
    SELECT * FROM state_tax_brackets
    WHERE year = ? AND filing_status = ? AND state = ?
  `;
  let [stateTaxBrackets] = await pool.execute(stateQuery, [
    year,
    scenario.marital_status,
    scenario.residence_state,
  ]);
  if (stateTaxBrackets.length == 0) {
    const query = `
      SELECT * from state_tax_brackets
      WHERE filing_status = ? AND state = ? AND year = (SELECT MAX(YEAR) FROM state_tax_brackets)
    `;
    stateTaxBrackets = await pool.execute(query, [
      scenario.marital_status,
      scenario.residence_state,
    ]);
    stateTaxBrackets = stateTaxBrackets[0];
  }

  const cptQuery = `
    SELECT * FROM capital_gains_tax
    WHERE year = ? AND filing_status = ?
  `;
  let [capitalTaxBrackets] = await pool.execute(cptQuery, [
    year,
    scenario.marital_status,
  ]);
  if (capitalTaxBrackets.length == 0) {
    const query = `
      SELECT * FROM capital_gains_tax
      WHERE filing_status = ? AND year = (SELECT MAX(YEAR) FROM capital_gains_tax)
    `;
    capitalTaxBrackets = await pool.execute(query, [scenario.marital_status]);
    capitalTaxBrackets = capitalTaxBrackets[0];
  }

  const deductionQuery = `
    SELECT * FROM standard_deductions
    WHERE filing_status = ? AND year = ?
  `;
  let [deductions] = await pool.execute(deductionQuery, [
    scenario.marital_status,
    year,
  ]);
  if (deductions.length == 0) {
    const query = `
      SELECT * FROM standard_deductions
      WHERE filing_status = ? and year = (SELECT MAX(YEAR) FROM standard_deductions)
    `;
    deductions = await pool.execute(query, [scenario.marital_status]);
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
export async function getFinancialGoal(scenarioId) {
  try {
    const [rows] = await pool.execute(
      `SELECT financial_goal FROM scenarios WHERE id = ?`,
      [scenarioId]
    );

    if (rows.length === 0) {
      return null; // Return null if no financial goal is found
    }

    const financialGoal = rows[0].financial_goal;
    return financialGoal;
  } catch (error) {
    console.error("Error fetching financial goal:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

export const getExpenseEvents = async (scenarioId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'expense'",
    [scenarioId]
  );

  return rows;
};

/**
 * Updates the event fields based on dimParams for 1D or 2D exploration.
 * @param {Array} dimParams - Array of parameter combinations.
 * @param {Object} events - Object containing different event types (incomeEvents, investEventYears, rebalanceEvents).
 */
function updateEventFields(dimParams, events) {
  if (!dimParams || dimParams.length === 0) return;

  const is2D = dimParams[0].hasOwnProperty("param2"); // Check if param2 exists in the first entry

  for (const param of dimParams) {
    const eventId = param.event; // Get the event ID from dimParams

    // Determine the event type and find the corresponding event
    let event = null;
    if (events.incomeEvents) {
      event = events.incomeEvents.find((e) => e.id === eventId);
    }
    if (!event && events.investEventYears) {
      event = events.investEventYears.find((e) => e.id === eventId);
    }
    if (!event && events.rebalanceEvents) {
      event = events.rebalanceEvents.find((e) => e.id === eventId);
    }

    if (event) {
      if (is2D) {
        // **2D Exploration: Update two fields**
        updateEventField(event, Object.keys(param)[0], param.param1);
        updateEventField(event, Object.keys(param)[1], param.param2);
      } else {
        // **1D Exploration: Update one field**
        updateEventField(event, Object.keys(param)[0], param.param1);
      }
    }
  }
}

/**
 * Updates a specific field of an event based on the parameter type and value.
 * @param {Object} event - The event object to update.
 * @param {string} field - The field to update (e.g., startYear, duration, initialAmount).
 * @param {any} value - The value to set for the field.
 */
function updateEventField(event, field, value) {
  if (!value) return;

  switch (field) {
    case "startYear":
      event.startYear = { type: "fixed", value }; // Update start year format
      break;

    case "duration":
      event.duration = { type: "fixed", value }; // Update duration format
      break;

    case "initialAmount":
      event.initialAmount = parseFloat(value); // Update initial amount as a double
      break;

    case "percentage":
      if (event.assetAllocations && event.assetAllocations.length === 2) {
        // Update the percentage for the first investment
        event.assetAllocations[0].percentage = value;
        // Automatically calculate the percentage for the second investment
        event.assetAllocations[1].percentage = 100 - value;
      }
      break;

    default:
      console.warn(`Unknown field: ${field}`);
  }
}
