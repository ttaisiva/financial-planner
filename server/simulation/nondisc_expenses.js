import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions
import { getUserBirthYear } from "./monte_carlo_sim.js";
import { getEventDuration, getEventStartYear } from "./run_income_events.js";
import {
  calculateExpenseAmount,
  getExpenseWithdrawalStrategy,
} from "./disc_expenses.js";
import { pool } from "../utils.js";
import { logExpense } from "../logging.js";
/**
 * Pays non-discretionary expenses based on available cash and investments.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {Object} runningTotals - The current financial data (cash, income, gains, etc.).
 * @param {number} currentSimulationYear - The current simulation year.
 * @param {number} inflationRate - The inflation rate for the current year.
 * @param {number} date - The current date.
 * @param {number} taxes - The amount owed from federal, state, and capital gains tax
 * @returns {Object} Updated financial data.
 *
 */

export async function payNonDiscExpenses(
  scenarioId,
  runningTotals,
  currentSimulationYear,
  inflationRate,
  date,
  taxes,
  evtlog
) {

  // Fetch non-discretionary expenses
  const nonDiscretionaryExpenses = await getNonDiscretionaryExpenses(
    scenarioId
  );
 

  // Filter active non-discretionary events
  const activeEvents = await filterActiveNonDiscretionaryEvents(
    nonDiscretionaryExpenses,
    currentSimulationYear
  );
  runningTotals.expenses.push(...activeEvents);

  // Calculate total non-discretionary expenses
  const totalNonDiscExpenses = activeEvents.reduce((sum, expense) => {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );
    return (sum + expenseAmount).toFixed(2);
  }, 0);


  
  let remainingWithdrawal = totalNonDiscExpenses + taxes;

  // Iterate over non-discretionary expenses and pay them
  for (const expense of activeEvents) {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );

    if (runningTotals.cashInvestment >= expenseAmount) {
      // Pay the expense using cash
      runningTotals.cashInvestment -= expenseAmount;
      logExpense(evtlog, currentSimulationYear, expense.name, expenseAmount, "cash");
    } else {
      // Not enough cash, calculate the remaining amount to withdraw
      remainingWithdrawal =
        Number(expenseAmount) - Number(runningTotals.cashInvestment);

      // Perform withdrawals from investments
      const expenseWithdrawalStrategy = await getExpenseWithdrawalStrategy(
        scenarioId
      );

      let strategyInvestments = runningTotals.investments.filter((investment) =>
        expenseWithdrawalStrategy.some(
          (strategy) => strategy.investmentId === investment.id
        )
      );

      for (const investment of strategyInvestments) {
        if (remainingWithdrawal <= 0) break;

        const withdrawalAmount = Math.min(
          remainingWithdrawal,
          investment.value
        );

        // Calculate capital gain or loss
        let capitalGain = 0;
        if (investment.taxStatus === "non-retirement") {
          const purchasePriceID =
            runningTotals.purchasePrices[String(investment.id)];
          const currentValueBeforeSale = investment.value;
          investment.value -= withdrawalAmount;
          logExpense(evtlog, currentSimulationYear, expense.name, withdrawalAmount, investment.type);
          
          if (investment.value === 0) {
            capitalGain = withdrawalAmount - purchasePriceID;
          } else {
            const fractionSold = withdrawalAmount / currentValueBeforeSale;
            capitalGain =
              (currentValueBeforeSale - purchasePriceID) * fractionSold;
          }

          runningTotals.curYearGains += capitalGain;
        }

        // Update income for pre-tax retirement accounts
        if (investment.taxStatus === "pre-tax") {
          runningTotals.curYearIncome += withdrawalAmount;
        }

        // Update early withdrawals for pre-tax or after-tax retirement accounts if under 59
        const userAge = getUserBirthYear(scenarioId) + date;
        if (investment.taxStatus !== "non-retirement" && userAge < 59) {
          runningTotals.curYearEarlyWithdrawals += withdrawalAmount;
        }

        remainingWithdrawal -= withdrawalAmount;
      }

      if (remainingWithdrawal > 0) {
        console.warn(
          `Unable to fully pay ${expense.name}. Remaining unpaid: ${remainingWithdrawal}`
        );
        break; // Stop paying further expenses if this one cannot be fully paid
      }

      // Deduct the expense amount from cash
      runningTotals.cashInvestment = 0;
    }
  }
}

/**
 * Fetches non-discretionary expenses from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of non-discretionary expenses.
 */
async function getNonDiscretionaryExpenses(scenarioId) {
  const [rows] = await pool.execute(
    `SELECT 
            id,
            name,
            discretionary,
            initial_amount AS initialAmount,
            change_amt_or_pct AS changeAmtOrPct,
            change_distribution AS changeDistribution,
            inflation_adjusted AS inflationAdjusted,
            start AS start,
            duration AS duration
         FROM events
         WHERE scenario_id = ? AND type = 'expense' AND discretionary = 0`,
    [scenarioId]
  );
  return rows.map((row) => ({
    ...row,
    changeDistribution: row.changeDistribution,
    start: row.start,
  }));
}

/**
 * Filters non-discretionary events to include only those that are currently active.
 * @param {Array} nonDiscretionaryEvents - List of non-discretionary events.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {Promise<Array>} List of active non-discretionary events.
 */
async function filterActiveNonDiscretionaryEvents(
  nonDiscretionaryEvents,
  currentSimulationYear
) {
  const activeEvents = [];

  for (const event of nonDiscretionaryEvents) {
    const startYear = await getEventStartYear(event);
    const duration = await getEventDuration(event);
    const endYear = startYear + duration;

    if (currentSimulationYear >= startYear && currentSimulationYear < endYear) {
      activeEvents.push(event);
    }
  }

  return activeEvents;
}
