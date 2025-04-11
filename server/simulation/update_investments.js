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

import e from 'express';
import { ensureConnection } from '../server.js';
import { sample } from './preliminaries.js'; // Assuming you have a sampling function for probability distributions

/**
 * Updates investments for the current year.
 * @param {number} curYearIncome - Current year's income to be updated.
 * @returns {Object} Updated investments and curYearIncome.
 */
export async function updateInvestments(scenarioId, curYearIncome) {
    const investments = getAllInvestments();
    const investmentTypes = getAllInvestmentTypes();

    for (const investment of investments) {
    
        const investmentType = investmentTypes[investment.investment_type];

        if (!investmentType) {
            console.error(`Investment type ${investment.investment_type} not found.`);
            return investment;
        }

        const initialValue = investment.dollar_value;

        // a. Calculate the generated income
        let generatedIncome = 0;
        if (investmentType.expAnnIncomeType === 'fixed') {
            generatedIncome = investmentType.expAnnIncomeValue || 0;
        
        } else { 
            generatedIncome = sample({
                mean: investmentType.expAnnIncomeMean,
                std_dev: investmentType.expAnnIncomeStdDev,
                
            });
        
        }
        //account for percentage case
        if (investmentType.expAnnIncomeTypeAmtOrPct === 'percent') {
        generatedIncome = (generatedIncome / 100) * initialValue;
        }


        // b. Add the income to curYearIncome if applicable
        if (
            investment.tax_status === 'non-retirement' &&
            investmentType.taxability === 'taxable'
        ) {
            curYearIncome += generatedIncome;
        }

        // d. Calculate the change in value
        let updatedValue;
        let changeInValue = 0;
        if (investmentType.expAnnReturnType === 'fixed') {
            changeInValue = investmentType.expAnnReturnValue || 0;

        } else {
            changeInValue = sample({
                mean: investmentType.expAnnReturnMean,
                std_dev: investmentType.expAnnReturnStdDev,
            });
        }
        if (investmentType.expAnnReturnType === 'percent') {
        changeInValue = (changeInValue / 100) * initialValue;

        }
        updatedValue += changeInValue;

        // c. Add the income to the value of the investment (inital val of investment) -> reinvest income back into investment
        updatedValue = initialValue + generatedIncome;

        // e. Calculate this year’s expenses
        const averageValue = (initialValue + updatedValue) / 2;
        const expenses = averageValue * (investmentType.expenseRatio / 100);
        updatedValue -= expenses;

        // Ensure the updated value is not negative
        updatedValue = Math.max(updatedValue, 0);

        //update investment in the db with the updated value
        try {
            await connection.execute(
                `UPDATE investments 
                 SET dollar_value = ? 
                 WHERE id = ? AND scenario_id = ?`,
                [updatedValue, investment.id, scenarioId]
            );
        } catch (error) {
            console.error(`Error updating investment with ID ${investment.id}:`, error);
            throw new Error("Failed to update investment in the database.");
        }
    
    }

    return {
        curYearIncome,
    };
   
}


/**
 * Fetches all investments for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} List of investments with their details.
 */
export async function getAllInvestments(scenarioId,n) {
    await ensureConnection(); // Ensure the database connection is active

    try {
        const [rows] = await connection.execute(
            `SELECT 
                id,
                investment_type,
                dollar_value,
                tax_status
             FROM investments
             WHERE scenario_id = ?`,
            [scenarioId]
        );

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
                expAnnReturnType,
                expAnnReturnValue,
                expAnnReturnMean,
                expAnnReturnStdDev,
                expAnnReturnTypeAmtOrPct,
                expenseRatio,
                expAnnIncomeType,
                expAnnIncomeValue,
                expAnnIncomeMean,
                expAnnIncomeStdDev,
                expAnnIncomeTypeAmtOrPct,
                taxability
             FROM investment_types
             WHERE scenario_id = ?`,
            [scenarioId]
        );

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