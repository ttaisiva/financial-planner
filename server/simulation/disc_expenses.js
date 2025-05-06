import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions
import { getUserBirthYear } from "./monte_carlo_sim.js";
import { getEventDuration, getEventStartYear } from "./run_income_events.js";
import { pool } from "../utils.js";
import { calculateAdjustedExpense } from "./nondisc_expenses.js";
import { logExpense } from "../logging.js";


/**
 * Pays discretionary expenses based on the spending strategy and available cash.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {number} cashInvestment - The current cash available.
 * @param {number} curYearIncome - The current year's income.
 * @param {number} curYearGains - The current year's capital gains.
 * @param {number} curYearEarlyWithdrawals - The current year's early withdrawals.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {Object} Updated financial data.
 */
export async function payDiscExpenses(
  scenarioId,
  runningTotals,
  financialGoal,
  currentSimulationYear,
  inflationRate,
  date,
  isSpouseAlive,
  evtlog
) {
  const discretionaryExpenses = await getDiscretionaryExpenses(scenarioId);
  const activeEvents = await filterActiveDiscretionaryEvents(
    discretionaryExpenses,
    currentSimulationYear
  );

  const adjustedExpenses = activeEvents.map((event) => {
    const adjustedAmount = calculateAdjustedExpense(
      event,
      currentSimulationYear,
      inflationRate
    );

    return {
      ...event,
      adjustedAmount: Math.round(adjustedAmount * 100) / 100, // Store the adjusted amount
    };
  });
  runningTotals.expenses.push(...adjustedExpenses);

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
  let actualDiscExpensesAmt = 0;
  for (const expense of sortedExpenses) {
    let expenseAmount = calculateExpenseAmount(
      expense,
      currentSimulationYear,
      inflationRate
    );
    console.log("Expense cal: ", Number(expenseAmount));

    // Adjust for spouse death
    if (!isSpouseAlive) {
      const spousePortion =
        Math.round(expenseAmount * (1 - expense.userFraction) * 100) / 100;
      expenseAmount -= spousePortion;
    }

    // Check if the expense is within the financial goal
    const totalAssetsAfterExpense = calculateTotalAssets(runningTotals);
    console.log(" totalAssetsAfterExpense: ", totalAssetsAfterExpense);
    if (
      runningTotals.cashInvestment >= expenseAmount
       && totalAssetsAfterExpense >=  financialGoal
    ) {
      // Pay the expense using cash
      runningTotals.cashInvestment -= expenseAmount;
      if (!evtlog) throw new Error("evtlog is undefined in payDiscExpenses");
      logExpense(
        evtlog,
        currentSimulationYear,
        expense.name,
        Number(expenseAmount),
        "cash"
      );
      //console.log("Expense AMT", Number(expenseAmount));
      actualDiscExpensesAmt += Number(expenseAmount); //this is for tracking if we paid the full amount of the disc expense or we still have money leftover
    } else {
      // Not enough cash, calculate the remaining amount to withdraw
      remainingWithdrawal =
        expenseAmount - Number(runningTotals.cashInvestment);

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
        if (remainingWithdrawal > financialGoal){
          // only withdraw the amount while financial goal is valid
          remainingWithdrawal -= financialGoal;
        }

        if (remainingWithdrawal <= 0) break;

        const withdrawalAmount = Math.min(
          remainingWithdrawal,
          Number(investment.value)
        );

        // Calculate capital gain or loss
        let capitalGain = 0;
        if (investment.taxStatus === "non-retirement") {
          const purchasePriceID =
            runningTotals.purchasePrices[String(investment.id)];
          const currentValueBeforeSale = investment.value;
          investment.value -= withdrawalAmount;
          if (!evtlog)
            throw new Error("evtlog is undefined in payDiscExpenses");
          logExpense(
            evtlog,
            currentSimulationYear,
            expense.name,
            withdrawalAmount,
            investment.type
          );

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
        //meaning we could not pay the full expense
        actualDiscExpensesAmt +=
          Number(expenseAmount) - Number(remainingWithdrawal); // Track the amount actually paid
        break; // Stop paying further expenses if this one cannot be fully paid
      } else {
        //meaning with the money form strategy we could pay the full expense
        actualDiscExpensesAmt += Number(expenseAmount); // Track the full amount paid
      }

      // Deduct the expense amount from cash
      runningTotals.cashInvestment = 0;
    }
  }
  runningTotals.actualDiscExpenses = Number(actualDiscExpensesAmt); // Track the total discretionary expenses paid
}

/**
 * Fetches discretionary expenses from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of discretionary expenses.
 */
async function getDiscretionaryExpenses(scenarioId) {
  const [rows] = await pool.execute(
    `SELECT 
            id,
            name,
            discretionary AS discretionary,
            initial_amount AS initialAmount,
            change_amt_or_pct AS changeAmtOrPct,
            change_distribution AS changeDistribution,
            inflation_adjusted AS inflationAdjusted,
            start AS start,
            duration AS duration,
            user_fraction AS userFraction
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
  const [rows] = await pool.execute(
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

  // Calculate the number of years since the expense started
  const startingYear = getEventStartYear(expense);
  const yearsSinceStart = currentSimulationYear - startingYear;

  // Apply annual changes for each year since the start
  for (let i = 0; i < yearsSinceStart; i++) {
    if (expense.changeAmtOrPct === "percent") {
      const sampledChange = sample(expense.changeDistribution);
      amount *= 1 + sampledChange;
    } else if (expense.changeAmtOrPct === "amount") {
      const sampledChange = sample(expense.changeDistribution);
      amount += sampledChange;
    }

    // Apply inflation adjustment for each year
    if (expense.inflationAdjusted) {
      amount *= 1 + inflationRate;
    }
  }

  return Number(amount).toFixed(2); // Round to 2 decimal places for precision
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
  const [rows] = await pool.execute(
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

function calculateTotalAssets(runningTotals) {
  const totalInvestments = runningTotals.investments.reduce(
    (sum, investment) => sum + Number(investment.value),
    0
  );
  return runningTotals.cashInvestment + totalInvestments;
}
