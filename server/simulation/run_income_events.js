// 2. Run income events, adding the income to the cash investment.
// a. The amount of this income event in the previous year needs to be stored and updated based on the
// expected annual change in amount, because the expected annual change can be sampled from a
// probability distribution, and the sampling is done each year.
// b. If the inflation-adjustment flag is set, adjust the amount for inflation.
// c. If user or their spouse is dead, omit their percentage of the amount.
// d. Add the income to the cash investment.
// e. Update running total curYearIncome,
// f. Update running total curYearSS of social security benefits, if income type = social security.

const {sample} = require('./preliminaries');


const db = require('../db'); // Assuming you have a database connection module

/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} eventId - The ID of the income event.
 * @param {number} previousYearAmount - The amount from the previous year.
 * @returns {Object} The calculated data for the income event.
 */
async function get_income_events_data(eventId, previousYearAmount) {
    // Fetch event data from the database
    //is this rly how this works??
    const [rows] = await db.execute(
        `SELECT 
            expected_annual_change_type , 
            expected_annual_change_value AS value, 
            expected_annual_change_mean AS mean, 
            expected_annual_change_std_dev AS stdDev, 
            inflation_adjusted AS inflationAdjusted, 
            user_percentage AS userPercentage, 
            spouse_percentage AS spousePercentage, 
            event_type AS eventType 
         FROM events 
         WHERE id = ? AND event_type = 'income'`,
        [eventId]
    );

    if (rows.length === 0) {
        throw new Error(`No event found with ID: ${eventId}`);
    }

    const event = rows[0];
    let currentAmount = previousYearAmount;

    // Sample the expected annual change is there a better way to do this can i just pass in an object???
    currentAmount += sample(expected_annual_change); 
    
    // Return the updated amount and other event-related data
    return {
        currentAmount,
        inflationAdjusted: event.inflationAdjusted || false,
        userPercentage: event.userPercentage || 0,
        spousePercentage: event.spousePercentage || 0,
        eventType: event.eventType || null,
    };
}

/**
 * Processes an income event and updates financial data.
 * @param {number} eventId - The ID of the income event.
 * @param {number} previousYearAmount - The amount from the previous year.
 * @param {number} inflationRate - The inflation rate.
 * @param {boolean} isUserAlive - Whether the user is alive.
 * @param {boolean} isSpouseAlive - Whether the spouse is alive.
 * @param {number} cashInvestment - The current cash investment.
 * @param {number} curYearIncome - The current year's income total.
 * @param {number} curYearSS - The current year's social security total.
 * @returns {Object} Updated financial data after processing the event.
 */
async function process_income_event(eventId, previousYearAmount, inflationRate, isUserAlive, isSpouseAlive, cashInvestment, curYearIncome, curYearSS) {
    // Get all necessary data for the income event
    const {
        currentAmount,
        inflationAdjusted,
        userPercentage,
        spousePercentage,
        eventType,
    } = await get_income_events_data(eventId, previousYearAmount);

    let adjustedAmount = currentAmount;

    // Adjust for inflation if the inflation-adjustment flag is set
    if (inflationAdjusted) {
        adjustedAmount *= 1 + inflationRate;
    }

    // Omit user or spouse percentage if they are dead
    if (!isUserAlive) {
        adjustedAmount -= (userPercentage / 100) * currentAmount;
    }
    if (!isSpouseAlive) {
        adjustedAmount -= (spousePercentage / 100) * currentAmount;
    }

    // Add the income to the cash investment
    cashInvestment += adjustedAmount;

    // Update running total curYearIncome
    curYearIncome += adjustedAmount;

    // Update running total curYearSS if income type is social security
    if (eventType === "social_security") {
        curYearSS += adjustedAmount;
    }

    return {
        updatedAmount: currentAmount,
        cashInvestment,
        curYearIncome,
        curYearSS,
    };
}

module.exports = { process_income_event, get_income_events_data };