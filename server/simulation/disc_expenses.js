import { connection, ensureConnection } from "../server.js";
import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions
import { getUserBirthYear } from "./monte_carlo_sim.js";
import { getEventDuration, getEventStartYear } from "./run_income_events.js";

/**
 * Pays discretionary expenses based on the spending strategy and available cash.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {number} cashInvestment - The current cash available.
 * @param {number} curYearIncome - The current year's income.
 * @param {number} curYearSS - The current year's social security income.
 * @param {number} curYearGains - The current year's capital gains.
 * @param {number} curYearEarlyWithdrawals - The current year's early withdrawals.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {Object} Updated financial data.
 */
export async function payDiscExpenses(
  scenarioId,
  runningTotals,
  currentSimulationYear,
  inflationRate,
  date,
) {
  // Ensure database connection
  await ensureConnection();

  const discretionaryExpenses = await getDiscretionaryExpenses(scenarioId);
  const activeEvents = await filterActiveDiscretionaryEvents(
    discretionaryExpenses,
    currentSimulationYear
  );
  const totalDiscExpenses = activeEvents.reduce((sum, expense) => {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );
    return sum + expenseAmount;
  }, 0);

  let remainingWithdrawal = totalDiscExpenses;
  const spendingStrategy = await getSpendingStrategy(scenarioId);

  // Step 2: Sort discretionary expenses based on the spending strategy
  const sortedExpenses = spendingStrategy
    .map((strategy) =>
      activeEvents.find((event) => event.id === strategy.expense_id)
    )
    .filter(Boolean);

  // Step 3: Iterate over discretionary expenses and pay them if cash is available
  for (const expense of sortedExpenses) {
    const expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );

    if (runningTotals.cashInvestment >= expenseAmount) {
      // Pay the expense using cash
      runningTotals.cashInvestment -= expenseAmount;
    } else {
      // Not enough cash, calculate the remaining amount to withdraw
      remainingWithdrawal = expenseAmount - runningTotals.cashInvestment;

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
        break; // Stop paying further expenses if this one cannot be fully paid
      }

      // Deduct the expense amount from cash
      runningTotals.cashInvestment = 0;
    }
  }
}

/**
 * Fetches discretionary expenses from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of discretionary expenses.
 */
async function getDiscretionaryExpenses(scenarioId) {
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
         WHERE scenario_id = ? AND type = 'expense' AND discretionary = 1`,
    [scenarioId]
  );
  return rows.map((row) => ({
    ...row,
    changeDistribution: row.changeDistribution,
    start: row.start,
  }));
}

/**
 * Fetches the spending strategy from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} Ordered list of discretionary expense names.
 */
async function getSpendingStrategy(scenarioId) {
  const [rows] = await connection.execute(
    `SELECT expense_id, strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'spending'
         ORDER BY strategy_order ASC`,
    [scenarioId]
  );

  return rows;
}

/**
 * Calculates the amount of a discretionary expense for the current year.
 * @param {Object} expense - The expense object.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {number} The calculated expense amount.
 */
export function calculateExpenseAmount(
  expense,
  currentSimulationYear,
  inflationRate
) {
  let amount = expense.initialAmount;

  // Apply annual change
  if (expense.changeAmtOrPct === "percent") {
    const sampledChange = sample(expense.changeDistribution);
    amount *= 1 + sampledChange;
  } else if (expense.changeAmtOrPct === "amount") {
    const sampledChange = sample(expense.changeDistribution);
    amount += sampledChange;
  }

  // Apply inflation adjustment
  if (expense.inflationAdjusted) {
    amount *= 1 + inflationRate;
  }

  return amount;
}

/**
 * Filters discretionary events to include only those that are currently active.
 * Waits for the start year and duration values before processing each event.
 * @param {Array} discretionaryEvents - List of discretionary events.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {Promise<Array>} List of active discretionary events.
 */
async function filterActiveDiscretionaryEvents(
  discretionaryEvents,
  currentSimulationYear
) {
  const activeEvents = [];

  for (const event of discretionaryEvents) {
    const startYear = await getEventStartYear(event);
    const duration = await getEventDuration(event);
    const endYear = startYear + duration;

    if (currentSimulationYear >= startYear && currentSimulationYear < endYear) {
      activeEvents.push(event);
    }
  }

  return activeEvents;
}

/**
 * Fetches the expense withdrawal strategy from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Promise<Array>} Ordered list of investments for expense withdrawal.
 */
export async function getExpenseWithdrawalStrategy(scenarioId) {
  const [rows] = await connection.execute(
    `SELECT investment_id, strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'expense_withdrawal'
         ORDER BY strategy_order ASC`,
    [scenarioId]
  );

  return rows.map((row) => ({
    investmentId: row.investment_id,
    strategyOrder: row.strategy_order,
  }));
}
