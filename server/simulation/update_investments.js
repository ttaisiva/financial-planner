// a. Calculate the generated income, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// b. Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the
// investment type’s taxability is ‘taxable’. (For investments in pre-tax retirement accounts, the income
// is taxable in the year it is withdrawn from the account. For investments in after-tax retirement
// accounts, the income is not taxable.)
// c. Add the income to the value of the investment. 
// d. Calculate the change in value, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// e. Calculate this year’s expenses, by multiplying the expense ratio and the average value of the
// investment (i.e., the average of its value at the beginning and end of the year). Subtract the
// expenses from the value.


import { ensureConnection, connection } from '../server.js';
import { sample } from './preliminaries.js'; // Assuming you have a sampling function for probability distributions

/**
 * Updates investments for the current year.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {number} curYearIncome - Current year's income to be updated.
 * @returns {Object} Updated investments and curYearIncome.
 */
export async function updateInvestments(scenarioId, curYearIncome) {
    console.log(`Starting updateInvestments for scenario ID: ${scenarioId}`);

    // Fetch investments and investment types
    const investments = await getAllInvestments(scenarioId);
    const investmentTypes = await getAllInvestmentTypes(scenarioId);

    console.log(`Fetched ${investments.length} investments for scenario ID: ${scenarioId}`);
    console.log(`Fetched ${Object.keys(investmentTypes).length} investment types for scenario ID: ${scenarioId}`);

    for (const investment of investments) {
        console.log(`Processing investment ID: ${investment.id}, type: ${investment.investment_type}, value: ${investment.value}`);

        const investmentType = investmentTypes[investment.investment_type];

        if (!investmentType) {
            console.error(`Investment type ${investment.investment_type} not found.`);
            continue; // Skip this investment if its type is not found
        }

        const initialValue = Number(investment.value);

        // a. Calculate the generated income
        let generatedIncome = 0;
        generatedIncome = sample(investmentType.income_distribution);
        console.log(`Generated income (sampled): ${generatedIncome}`);
        // Account for percentage case
        if (investmentType.income_amt_or_pct === 'percent') {
            generatedIncome = (generatedIncome / 100) * initialValue;
            console.log(`Generated income (percentage adjusted): ${generatedIncome}`);
        }

        // b. Add the income to curYearIncome if applicable
        if (
            investment.tax_status === 'non-retirement' &&
            investmentType.taxability === 'taxable'
        ) {
            curYearIncome += generatedIncome;
            console.log(`Added generated income to curYearIncome. Updated curYearIncome: ${curYearIncome}`);
        }

        // d. Calculate the change in value
        let changeInValue = 0;
        changeInValue= sample(investmentType.return_distribution);
        console.log(`Change in value (sampled): ${changeInValue}`);
        // Account for percentage case
        if (investmentType.return_amt_or_pct === 'percent') {
            changeInValue = (changeInValue / 100) * initialValue;
            console.log(`Change in value (percentage adjusted): ${changeInValue}`);
        }

        let updatedValue = changeInValue;

        // c. Add the income to the value of the investment (initial value of investment) -> reinvest income back into investment
        updatedValue += initialValue + generatedIncome;
        console.log(`Updated value after adding income and initial value: ${updatedValue}`);

        // e. Calculate this year’s expenses
        const averageValue = (initialValue + updatedValue) / 2;
        const expenses = averageValue * (investmentType.expenseRatio / 100);
        updatedValue -= expenses;
        console.log(`Calculated expenses: ${expenses}. Updated value after subtracting expenses: ${updatedValue}`);

        // Ensure the updated value is not negative
        updatedValue = Math.max(updatedValue, 0);
        console.log(`Final updated value (non-negative): ${updatedValue}`);

        // Update investment in the database with the updated value
        try {
            await connection.execute(
                `UPDATE investments 
                 SET value = ? 
                 WHERE id = ? AND scenario_id = ?`,
                [updatedValue, investment.id, scenarioId]
            );
            console.log(`Successfully updated investment ID: ${investment.id} with new value: ${updatedValue}`);
        } catch (error) {
            console.error(`Error updating investment with ID ${investment.id}:`, error);
            throw new Error("Failed to update investment in the database.");
        }
    }

    console.log(`Finished updating investments for scenario ID: ${scenarioId}`);
    return {
        curYearIncome,
    };
}

/**
 * Fetches all investments for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of investments with their details.
 */
export async function getAllInvestments(scenarioId) {
    await ensureConnection(); // Ensure the database connection is active

    try {
        const [rows] = await connection.execute(
            `SELECT 
                id,
                investment_type,
                value,
                tax_status
             FROM investments
             WHERE scenario_id = ?`,
            [scenarioId]
        );

        console.log(`Fetched ${rows.length} investments from the database for scenario ID: ${scenarioId}`);
        return rows; // Return the list of investments
    } catch (error) {
        console.error("Error fetching investments:", error);
        throw new Error("Unable to fetch investments from the database.");
    }
}

/**
 * Fetches all investment types for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Object} A map of investment types, where the keys are the investment type names and the values are their details.
 */
export async function getAllInvestmentTypes(scenarioId) {
    await ensureConnection(); // Ensure the database connection is active

    try {
        const [rows] = await connection.execute(
            `SELECT 
                name,
                description,
                return_distribution,
                return_amt_or_pct,
                expense_ratio,
                income_distribution,
                income_amt_or_pct,
                taxability
             FROM investment_types
             WHERE scenario_id = ?`,
            [scenarioId]
        );

        console.log(`Fetched ${rows.length} investment types from the database for scenario ID: ${scenarioId}`);
        console.log("rows: ", rows)
        // Convert the rows into a map for easy lookup by investment type name
        const investmentTypes = {};
        rows.forEach(row => {
            investmentTypes[row.name] = row;
        });

        return investmentTypes; // Return the map of investment types
    } catch (error) {
        console.error("Error fetching investment types:", error);
        throw new Error("Unable to fetch investment types from the database.");
    }
}