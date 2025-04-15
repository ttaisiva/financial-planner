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
    investments
) {
    console.log(`Paying discretionary expenses for scenario ID: ${scenarioId}, year: ${currentSimulationYear}`);

    // Ensure database connection
    await ensureConnection();

    //pay prev year taxes here ...

    const discretionaryExpenses = await getDiscretionaryExpenses(scenarioId);
    console.log("Discretionary expenses fetched:", discretionaryExpenses);
    const activeEvents = await filterActiveDiscretionaryEvents(discretionaryExpenses, currentSimulationYear);
    console.log("active events" , activeEvents);
    const totalDiscExpenses = activeEvents.reduce((sum, expense) => {
        const expenseAmount = calculateExpenseAmount(expense, currentSimulationYear, inflationRate);
        return sum + expenseAmount;
    }, 0);
    console.log("Total discretionary expenses for the year:", totalDiscExpenses);

    let remainingWithdrawal = totalDiscExpenses; // + taxes @Violet please add the taxes here so do let remainingWithdrawal = totalDiscExpenses + taxes
    //need to filter to only include the expenses that are currently active
    const spendingStrategy = await getSpendingStrategy(scenarioId);
    console.log("Spending strategy fetched:", spendingStrategy);


    // Step 2: Sort discretionary expenses based on the spending strategy
    const sortedExpenses = spendingStrategy
    .map((strategy) => activeEvents.find((event) => event.id === strategy.expense_id))
    .filter(Boolean);

    console.log("Sorted discretionary expenses based on spending strategy:", sortedExpenses);


    // Step 3: Iterate over discretionary expenses and pay them if cash is available
    for (const expense of sortedExpenses) {


        const expenseAmount = calculateExpenseAmount(expense, currentSimulationYear, inflationRate);
        console.log(`Attempting to pay expense: ${expense.name}, amount: ${expenseAmount}`);

        console.log("cashInvestment", runningTotals.cashInvestment);

        if (runningTotals.cashInvestment >= expenseAmount) {
            // Pay the expense using cash
            runningTotals.cashInvestment -= expenseAmount;
            console.log(`Paid ${expense.name} using cash. Remaining cash: ${runningTotals.cashInvestment}`);
        } else {
            // Not enough cash, calculate the remaining amount to withdraw
            remainingWithdrawal = expenseAmount - runningTotals.cashInvestment;
            console.log(`Insufficient cash for ${expense.name}. Remaining withdrawal needed: ${remainingWithdrawal}`);

            // Perform withdrawals from investments
            const expenseWithdrawalStrategy = await getExpenseWithdrawalStrategy(scenarioId);
            console.log("Expense withdrawal strategy fetched:", expenseWithdrawalStrategy);
            console.log("investments", investments);
            let strategyInvestments = investments.filter((investment) =>
                expenseWithdrawalStrategy.some((strategy) => strategy.investmentId === investment.id)
            );
            console.log("strategy investments", strategyInvestments);
            for (const investment of strategyInvestments) {
                if (remainingWithdrawal <= 0) break;

                
                const withdrawalAmount = Math.min(remainingWithdrawal, investment.value);

                // Calculate capital gain or loss
                let capitalGain = 0;
                if (investment.taxStatus === "non-retirement") {
                    console.log(`Withdrawing from non-retirement account: ${investment.id}`);
                    const purchasePrice =  runningTotals.purchasePrices;
                    console.log("purchase price", purchasePrice);
                    console.log("investment id", investment.id);
                    const purchasePriceID =  runningTotals.purchasePrices[String(investment.id)]; // Assuming purchasePrice is an object with investment IDs as keys
                    const currentValueBeforeSale = investment.value;
                    investment.value -= withdrawalAmount;
                    if (investment.value === 0) {
                        capitalGain = withdrawalAmount - purchasePriceID;
                    }
                    else {
                        const fractionSold = withdrawalAmount / currentValueBeforeSale;
                        console.log(`Fraction sold: ${fractionSold}`);
                        capitalGain = (currentValueBeforeSale - purchasePriceID) * fractionSold;
                    }

                    runningTotals.curYearGains += capitalGain;
                    console.log(`Updated curYearGains after withdrawal: ${runningTotals.curYearGains}`);
                }


                // Update income for pre-tax retirement accounts
                if (investment.taxStatus === "pre-tax") {
                    runningTotals.curYearIncome += withdrawalAmount;
                    console.log(`Updated curYearIncome for pre-tax account. New value: ${runningTotals.curYearIncome}`);
                }

                // Update early withdrawals for pre-tax or after-tax retirement accounts if under 59
                const userAge = getUserBirthYear(scenarioId) + date; //need to change this
                if (investment.taxStatus !== "non-retirement" && userAge < 59) {
                    runningTotals.curYearEarlyWithdrawals += withdrawalAmount;
                }

                remainingWithdrawal -= withdrawalAmount;
                console.log(`Withdrew ${withdrawalAmount} from investment ${investment.id}. Remaining withdrawal: ${remainingWithdrawal}`);
            }

            if (remainingWithdrawal > 0) {
                console.warn(`Unable to fully pay ${expense.name}. Remaining unpaid: ${remainingWithdrawal}`);
                break; // Stop paying further expenses if this one cannot be fully paid
            }

            // Deduct the expense amount from cash
            runningTotals.cashInvestment = 0;
            console.log(`Paid ${expense.name} using cash and withdrawals. Remaining cash: ${runningTotals.cashInvestment}`);
        }

    }

    
    
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
            start AS start,
            duration AS duration
         FROM events
         WHERE scenario_id = ? AND type = 'expense' AND discretionary = 1`,
        [scenarioId]
    );
    console.log("Discretionary expenses fetched:", rows);
    return rows.map((row) => ({
        ...row,
        changeDistribution: row.changeDistribution,
        start: row.start
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

    console.log("Spending strategy fetched:", rows);

    return rows;
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

/**
 * Filters discretionary events to include only those that are currently active.
 * Waits for the start year and duration values before processing each event.
 * @param {Array} discretionaryEvents - List of discretionary events.
 * @param {number} currentSimulationYear - The current simulation year.
 * @returns {Promise<Array>} List of active discretionary events.
 */
async function filterActiveDiscretionaryEvents(discretionaryEvents, currentSimulationYear) {
    const activeEvents = [];

    for (const event of discretionaryEvents) {
        // Wait for the start year and duration values
        const startYear = await getEventStartYear(event);
        console.log("start year", startYear);
        const duration = await getEventDuration(event);
        console.log("duration", duration);
        const endYear = startYear + duration;

        // Check if the current year is within the event's active period
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
    console.log(`Fetching expense withdrawal strategy for scenario ID: ${scenarioId}`);

    // Fetch the withdrawal strategy from the database
    const [rows] = await connection.execute(
        `SELECT investment_id, strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'expense_withdrawal'
         ORDER BY strategy_order ASC`,
        [scenarioId]
    );

    console.log("Expense withdrawal strategy fetched:", rows);

    // Return the ordered list of investment IDs and their strategy order
    return rows.map((row) => ({
        investmentId: row.investment_id,
        strategyOrder: row.strategy_order
    
    }));
}

