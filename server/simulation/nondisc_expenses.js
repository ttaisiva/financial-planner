import { connection } from "../server.js";

export async function payNondiscExpenses(scenarioId) {

    //this is only for logged in user, for guest user, we need to fetch the data from local storage
    // non discretionary: non-optional
    const [rows] = await connection.execute(
        `SELECT 
            id,
            name,
            description,
            initial_amount,
            inflation_adjusted,
            start_value,
            start_mean,
            start_std_dev,
            start_lower,
            start_upper,
            start_series_start,
            start_series_end,
            duration_type,
            duration_value,
            duration_mean,
            duration_std_dev,
            duration_lower,
            duration_upper,
            annual_change_type,
            annual_change_value,
            annual_change_type_amt_or_pct,
            annual_change_mean,
            annual_change_std_dev,
            annual_change_lower,
            annual_change_upper, 
         FROM events
         WHERE scenario_id = ? AND event_type = '' AND discretionary = true`,
        [scenarioId]
    );

}
