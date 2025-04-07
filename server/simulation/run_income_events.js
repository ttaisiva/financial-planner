// 2. Run income events, adding the income to the cash investment.
// a. The amount of this income event in the previous year needs to be stored and updated based on the
// expected annual change in amount, because the expected annual change can be sampled from a
// probability distribution, and the sampling is done each year.
// b. If the inflation-adjustment flag is set, adjust the amount for inflation.
// c. If user or their spouse is dead, omit their percentage of the amount.
// d. Add the income to the cash investment.
// e. Update running total curYearIncome,
// f. Update running total curYearSS of social security benefits, if income type = social security.



import {sample} from './preliminaries.js';



/**
 * Fetches and calculates necessary data for an income event from the database.
 * @param {number} eventId - The ID of the income event.
 * @param {number} previousYearAmount - The amount from the previous year.
 * @returns {Object} The calculated data for the income event.
 */
export async function get_income_events_data(scenario_id, previousYearAmounts) {
    //need to update this to get data from localStorage instead....
    const [rows] = await db.execute(
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
        [scenario_id]
    );

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
 * @returns {Object} The updated financial data.
 */
export async function process_income_event(
    scenario_id,
    previousYearAmounts,
    inflationRate,
    isUserAlive,
    isSpouseAlive,
    cashInvestment,
    curYearIncome,
    curYearSS
) {
    // Get all income events and calculate current amounts
    const incomeEvents = await get_income_events_data(scenario_id, previousYearAmounts);

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
    }

    return {
        updatedAmounts,     
        cashInvestment,
        curYearIncome,
        curYearSS
    };
}


