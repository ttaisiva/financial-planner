import { connection, ensureConnection } from "../server.js";
import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions

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
    cashInvestment,
    curYearIncome,
    curYearSS,
    curYearGains,
    curYearEarlyWithdrawals,
    currentSimulationYear,
    inflationRate
) {
    console.log(`Paying discretionary expenses for scenario ID: ${scenarioId}, year: ${currentSimulationYear}`);

    // Ensure database connection
    await ensureConnection();

    // Step 1: Fetch discretionary expenses and spending strategy from the database
    const discretionaryExpenses = await getDiscretionaryExpenses(scenarioId);
    const spendingStrategy = await getSpendingStrategy(scenarioId);

    // Step 2: Sort discretionary expenses based on the spending strategy
    const sortedExpenses = spendingStrategy.map((expenseName) =>
        discretionaryExpenses.find((expense) => expense.name === expenseName)
    ).filter(Boolean); // Remove any undefined expenses

    console.log("Sorted discretionary expenses based on spending strategy:", sortedExpenses);

    // Step 3: Iterate over discretionary expenses and pay them if cash is available
    for (const expense of sortedExpenses) {
        const expenseAmount = calculateExpenseAmount(expense, currentSimulationYear, inflationRate);
        console.log(`Attempting to pay expense: ${expense.name}, amount: ${expenseAmount}`);

        if (cashInvestment >= expenseAmount) {
            // Pay the expense using cash
            cashInvestment -= expenseAmount;
            console.log(`Paid ${expense.name} using cash. Remaining cash: ${cashInvestment}`);
        } else {
            // Not enough cash, calculate the remaining amount to withdraw
            let remainingWithdrawal = expenseAmount - cashInvestment;
            console.log(`Insufficient cash for ${expense.name}. Remaining withdrawal needed: ${remainingWithdrawal}`);

            // Perform withdrawals from investments
            const expenseWithdrawalStrategy = await getExpenseWithdrawalStrategy(scenarioId);
            for (const investment of expenseWithdrawalStrategy) {
                if (remainingWithdrawal <= 0) break;

                const investmentValue = investment.value;
                const withdrawalAmount = Math.min(remainingWithdrawal, investmentValue);

                // Calculate capital gain or loss
                let capitalGain = 0;
                if (investment.taxStatus === "non-retirement") {
                    capitalGain = withdrawalAmount - investment.purchasePrice;
                    curYearGains += capitalGain;
                }

                // Update investment value and purchase price
                investment.value -= withdrawalAmount;
                if (investment.value === 0) {
                    investment.purchasePrice = 0;
                } else {
                    const fractionSold = withdrawalAmount / investmentValue;
                    investment.purchasePrice *= (1 - fractionSold);
                }

                // Update income for pre-tax retirement accounts
                if (investment.taxStatus === "pre-tax") {
                    curYearIncome += withdrawalAmount;
                }

                // Update early withdrawals for pre-tax or after-tax retirement accounts if under 59
                const userAge = currentSimulationYear - investment.birthYear;
                if (investment.taxStatus !== "non-retirement" && userAge < 59) {
                    curYearEarlyWithdrawals += withdrawalAmount;
                }

                remainingWithdrawal -= withdrawalAmount;
                console.log(`Withdrew ${withdrawalAmount} from investment ${investment.id}. Remaining withdrawal: ${remainingWithdrawal}`);
            }

            if (remainingWithdrawal > 0) {
                console.warn(`Unable to fully pay ${expense.name}. Remaining unpaid: ${remainingWithdrawal}`);
                break; // Stop paying further expenses if this one cannot be fully paid
            }

            // Deduct the expense amount from cash
            cashInvestment = 0;
            console.log(`Paid ${expense.name} using cash and withdrawals. Remaining cash: ${cashInvestment}`);
        }
    }

    return {
        cashInvestment,
        curYearIncome,
        curYearGains,
        curYearEarlyWithdrawals,
    };
}

/**
 * Fetches discretionary expenses from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of discretionary expenses.
 */
async function getDiscretionaryExpenses(scenarioId) {
    console.log(`Fetching discretionary expenses for scenario ID: ${scenarioId}`);
    const [rows] = await connection.execute(
        `SELECT 
            id,
            name,
            initial_amount AS initialAmount,
            change_amt_or_pct AS changeAmtOrPct,
            change_distribution AS changeDistribution,
            inflation_adjusted AS inflationAdjusted,
            start AS startYear
         FROM events
         WHERE scenario_id = ? AND type = 'expense' AND discretionary = true`,
        [scenarioId]
    );
    return rows.map((row) => ({
        ...row,
        changeDistribution: JSON.parse(row.changeDistribution),
        startYear: JSON.parse(row.start) 
    }));
}

/**
 * Fetches the spending strategy from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} Ordered list of discretionary expense names.
 */
async function getSpendingStrategy(scenarioId) {
    console.log(`Fetching spending strategy for scenario ID: ${scenarioId}`);
    const [rows] = await connection.execute(
        `SELECT expense_id, strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'spending'
         ORDER BY strategy_order ASC`,
        [scenarioId]
    );

    // Map expense IDs to names
    const expenseIds = rows.map((row) => row.expense_id);
    const [expenseRows] = await connection.execute(
        `SELECT id, name
         FROM events
         WHERE id IN (?)`,
        [expenseIds]
    );

    const expenseMap = Object.fromEntries(expenseRows.map((row) => [row.id, row.name]));
    return rows.map((row) => expenseMap[row.expense_id]);
}

/**
 * Calculates the amount of a discretionary expense for the current year.
 * @param {Object} expense - The expense object.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {number} The calculated expense amount.
 */
function calculateExpenseAmount(expense, currentSimulationYear, inflationRate) {
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

        amount *=  1+ inflationRate;
        console.log(
            `Applied inflation adjustment. New adjustedAmount: ${amount}`
        );
    }

    return amount;
}