import { connection, ensureConnection } from "../server.js";
import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions
import { getUserBirthYear } from "./monte_carlo_sim.js";
import { getEventDuration, getEventStartYear } from "./run_income_events.js";
import {
  calculateExpenseAmount,
  getExpenseWithdrawalStrategy,
} from "./disc_expenses.js";
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
  taxes
) {
  console.log(
    `Paying non-discretionary expenses for scenario ID: ${scenarioId}, year: ${currentSimulationYear}`
  );

  // Ensure database connection
  await ensureConnection();

  // Fetch non-discretionary expenses
  const nonDiscretionaryExpenses = await getNonDiscretionaryExpenses(
    scenarioId
  );
  console.log("Non-discretionary expenses fetched:", nonDiscretionaryExpenses);

  // Filter active non-discretionary events
  const activeEvents = await filterActiveNonDiscretionaryEvents(
    nonDiscretionaryExpenses,
    currentSimulationYear
  );
  console.log("Active non-discretionary events:", activeEvents);

  // Calculate total non-discretionary expenses
  const totalNonDiscExpenses = activeEvents.reduce((sum, expense) => {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );
    return (sum + expenseAmount).toFixed(2);
  }, 0);
  console.log(
    "Total non-discretionary expenses for the year:",
    totalNonDiscExpenses
  );

  console.log("nondisc taxes", taxes);
  let remainingWithdrawal = totalNonDiscExpenses + taxes;
  console.log("Remaining withdrawal:", remainingWithdrawal);

  // Iterate over non-discretionary expenses and pay them
  for (const expense of activeEvents) {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );
    console.log(
      `Attempting to pay non-discretionary expense: ${expense.name}, amount: ${expenseAmount}`
    );

    console.log("cashInvestment", runningTotals.cashInvestment);

    if (runningTotals.cashInvestment >= expenseAmount) {
      // Pay the expense using cash
      runningTotals.cashInvestment -= expenseAmount;
      console.log(
        `Paid ${expense.name} using cash. Remaining cash: ${runningTotals.cashInvestment}`
      );
    } else {
      // Not enough cash, calculate the remaining amount to withdraw
      remainingWithdrawal =
        Number(expenseAmount) - Number(runningTotals.cashInvestment);
      console.log(
        `Insufficient cash for ${expense.name}. Remaining withdrawal needed: ${remainingWithdrawal}`
      );

      // Perform withdrawals from investments
      const expenseWithdrawalStrategy = await getExpenseWithdrawalStrategy(
        scenarioId
      );
      console.log(
        "Expense withdrawal strategy fetched:",
        expenseWithdrawalStrategy
      );
      console.log("investments", runningTotals.investments);

      let strategyInvestments = runningTotals.investments.filter((investment) =>
        expenseWithdrawalStrategy.some(
          (strategy) => strategy.investmentId === investment.id
        )
      );
      console.log("strategy investments", strategyInvestments);

      for (const investment of strategyInvestments) {
        if (remainingWithdrawal <= 0) break;

        const withdrawalAmount = Math.min(
          remainingWithdrawal,
          investment.value
        );

        // Calculate capital gain or loss
        let capitalGain = 0;
        if (investment.taxStatus === "non-retirement") {
          console.log(
            `Withdrawing from non-retirement account: ${investment.id}`
          );
          const purchasePrice = runningTotals.purchasePrices;
          console.log("purchase price", purchasePrice);
          console.log("investment id", investment.id);
          const purchasePriceID =
            runningTotals.purchasePrices[String(investment.id)];
          const currentValueBeforeSale = investment.value;
          investment.value -= withdrawalAmount;
          if (investment.value === 0) {
            capitalGain = withdrawalAmount - purchasePriceID;
          } else {
            const fractionSold = withdrawalAmount / currentValueBeforeSale;
            console.log(`Fraction sold: ${fractionSold}`);
            capitalGain =
              (currentValueBeforeSale - purchasePriceID) * fractionSold;
          }

          runningTotals.curYearGains += capitalGain;
          console.log(
            `Updated curYearGains after withdrawal: ${runningTotals.curYearGains}`
          );
        }

        // Update income for pre-tax retirement accounts
        if (investment.taxStatus === "pre-tax") {
          runningTotals.curYearIncome += withdrawalAmount;
          console.log(
            `Updated curYearIncome for pre-tax account. New value: ${runningTotals.curYearIncome}`
          );
        }

        // Update early withdrawals for pre-tax or after-tax retirement accounts if under 59
        const userAge = getUserBirthYear(scenarioId) + date;
        if (investment.taxStatus !== "non-retirement" && userAge < 59) {
          runningTotals.curYearEarlyWithdrawals += withdrawalAmount;
        }

        remainingWithdrawal -= withdrawalAmount;
        console.log(
          `Withdrew ${withdrawalAmount} from investment ${investment.id}. Remaining withdrawal: ${remainingWithdrawal}`
        );
      }

      if (remainingWithdrawal > 0) {
        console.warn(
          `Unable to fully pay ${expense.name}. Remaining unpaid: ${remainingWithdrawal}`
        );
        break; // Stop paying further expenses if this one cannot be fully paid
      }

      // Deduct the expense amount from cash
      runningTotals.cashInvestment = 0;
      console.log(
        `Paid ${expense.name} using cash and withdrawals. Remaining cash: ${runningTotals.cashInvestment}`
      );
    }
  }
}

/**
 * Fetches non-discretionary expenses from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of non-discretionary expenses.
 */
async function getNonDiscretionaryExpenses(scenarioId) {
  console.log(
    `Fetching non-discretionary expenses for scenario ID: ${scenarioId}`
  );
  const [rows] = await connection.execute(
    `SELECT 
            id,
            name,
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
  console.log("Non-discretionary expenses fetched:", rows);
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
    console.log("start year", startYear);
    const duration = await getEventDuration(event);
    console.log("duration", duration);
    const endYear = startYear + duration;

    if (currentSimulationYear >= startYear && currentSimulationYear < endYear) {
      activeEvents.push(event);
    }
  }

  return activeEvents;
}
