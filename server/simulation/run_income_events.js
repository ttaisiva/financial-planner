// 2. Run income events, adding the income to the cash investment.
// a. The amount of this income event in the previous year needs to be stored and updated based on the
// expected annual change in amount, because the expected annual change can be sampled from a
// probability distribution, and the sampling is done each year.
// b. If the inflation-adjustment flag is set, adjust the amount for inflation.
// c. If user or their spouse is dead, omit their percentage of the amount.
// d. Add the income to the cash investment.
// e. Update running total curYearIncome,
// f. Update running total curYearSS of social security benefits, if income type = social security.

import { ensureConnection, connection } from "../server.js";


import {sample} from './preliminaries.js';



/**
 * Processes an income event and updates financial data.
 * @param {number} eventId - The ID of the income event.
 * @param {object} previousYearAmount - The amount from the previous year.
 * @param {number} inflationRate - The inflation rate.
 * @param {boolean} isUserAlive - Whether the user is alive.
 * @param {boolean} isSpouseAlive - Whether the spouse is alive.
 * @param {number} cashInvestment - The current cash investment.
 * @param {number} curYearIncome - The current year's income total.
 * @param {number} curYearSS - The current year's social security total.
 * @returns {Object} The updated financial data.
 */
export async function process_income_event(
    scenarioId,
    previousYearAmounts,
    inflationRate,
    isUserAlive,
    isSpouseAlive,
    cashInvestment,
    curYearIncome,
    curYearSS
) {
    // Get all income events and calculate current amounts
    
    const incomeEvents = await getIncomeEvents(scenarioId); // what if this is empty? need to apply a check for that

    const updatedAmounts = {}; // To store currentAmount for each event

    
    for (const event of incomeEvents) {
        
        let adjustedAmount = event.currentAmount;

        // Apply inflation adjustment
        if (event.inflationAdjusted) {
            adjustedAmount *= 1 + inflationRate;
        }

        // Omit user or spouse portion if they are dead
        if (!isUserAlive) {
            adjustedAmount -= (event.userPercentage / 100) * event.currentAmount;
        }
        if (!isSpouseAlive) {
            adjustedAmount -= (event.spousePercentage / 100) * event.currentAmount;
        }

        // Add to cash investment and income totals
        cashInvestment += adjustedAmount;
        curYearIncome += adjustedAmount;

        if (event.isSocialSecurity) {
            curYearSS += adjustedAmount;
        }

        updatedAmounts[event.id] = event.currentAmount; // Save the pre-adjusted amount

        //update income event in db? should i do this because technically the updated amounts are stored in updated amounts array
        // try {
        //     await connection.execute(
        //         `UPDATE events 
        //          SET current_amount = ? 
        //          WHERE id = ? AND scenario_id = ?`,
        //         [adjustedAmount, event.id, scenarioId]
        //     );
        // } catch (error) {
        //     console.error(`Error updating income event with ID ${event.id}:`, error);
        //     throw error; // Re-throw the error for the caller to handle
        // }

        
        
    }

    return {
        updatedAmounts,     
        cashInvestment,
        curYearIncome,
        curYearSS
    };
}

// TODO: edge case: no income events found, what to do then
/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} eventId - The ID of the income event.
 * @param {number} previousYearAmount - The amount from the previous year.
 * @returns {Object} The calculated data for the income event.
 */
export async function getIncomeEvents(scenarioId, previousYearAmounts) {
    //this is only for logged in user, for guest user, we need to fetch the data from local storage

    await ensureConnection();
    const [rows] = await connection.execute(
        `SELECT 
            id,
            annual_change_type, 
            annual_change_value, 
            annual_change_mean, 
            annual_change_std_dev, 
            annual_change_upper, 
            annual_change_lower, 
            annual_change_type_amt_or_pct
            inflation_adjusted, 
            user_percentage, 
            spouse_percentage, 
            is_social_security
            
         FROM events 
         WHERE scenario_id = ? AND event_type = 'income'`,
        [scenarioId]
    );

    if (rows.length === 0) {
        console.warn(`No income events found for scenario ID ${scenarioId}.`);
        return []; // Return an empty array
    }
    
    return rows.map(event => {
        const prevAmount = previousYearAmounts[event.id] || 0;  

        const sampledChange = sample({
            type: event.annual_change_type,
            value: event.annual_change_value,
            mean: event.annual_change_mean,
            std_dev: event.annual_change_std_dev, 
            upper: event.annual_change_upper,     
            lower: event.annual_change_lower,
        });

        const currentAmount = prevAmount + sampledChange;

        return {
            id: event.id,
            currentAmount,
            inflationAdjusted: event.inflation_adjusted || false,
            userPercentage: event.user_percentage || 0,
            spousePercentage: event.spouse_percentage || 0,
            isSocialSecurity: event.is_social_security || false,
        };
    });
}





