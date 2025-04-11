import { process_income_event } from './run_income_events.js';
import { run_preliminaries } from './preliminaries.js';
import { performRMDs } from './perform_rmds.js';
import { getIncomeEvents } from './run_income_events.js';


import { ensureConnection, connection } from "../server.js";
/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export async function simulation(date , num_simulations, userId, scenarioId, connection) { 
    const total_years = get_total_years(date, scenarioId, connection);

    const simulation_results = [];


    for (let sim = 0; sim < num_simulations; sim++) {
        let yearly_results = [];
        let previousYearAmounts = {}; // Placeholder for previous year amounts for income events
        let inflationRate;
        let isUserAlive = true;
        let isSpouseAlive = true;
        let cashInvestment = 0; //this dani is working on in new scenario -> need to get this from db.
        let curYearIncome = 0;
        let curYearSS = 0;
        const incomeEvents = await getIncomeEvents(scenarioId, []); // Fetch income events to determine the number of events
        

        for (let year = 0; year < total_years; year++) { //years in which the simulation is  being run
            
            const currentSimulationYear = date + year; //actual year being simulated

            //run preliminaries -> need to further implement this
            const { inflationRate } = run_preliminaries(currentSimulationYear, scenarioId, connection);

            // Run income events
            if (year === 0) {
            
                // Populate the object with initial amounts based on event IDs
                incomeEvents.forEach(event => {
                    previousYearAmounts[event.id] = event.initialAmount || 0; // Use initialAmount or default to 0
                });
            }
            ({
                updatedAmounts,
                cashInvestment,
                curYearIncome,
                curYearSS,
            } = await process_income_event(
                scenarioId,
                previousYearAmounts,
                inflationRate,
                isUserAlive,
                isSpouseAlive,
                cashInvestment,
                curYearIncome,
                curYearSS
            ));

            // Perform required minimum distributions (RMDs)
            performRMDs(userId, currentSimulationYear, curYearIncome);
          

            // Optimize Roth conversions
          

            // Update investments
            

            // Pay non-discretionary expenses
          

            // Pay discretionary expenses
         

            // Process investment events
       

            // Rebalance investments
        

            // Collect yearly results -> need to impelemnt this
            yearly_results.push({
                year: current_simulation_year,
                cash_flow: 0, 
                investments: 0,
            });
        }

        simulation_results.push(yearly_results);
    }

    return calculate_stats(simulation_results); // Calculate median, mean, and other statistics
}



/**
 * Calculates the total number of years for the simulation based on the user's and spouse's lifespans.
 * @param {number} date - starting year of simulation
 * @param {Object} scenario - The scenario object containing user and spouse details.
 * @returns {number} The total number of years for the simulation.
 */
export async function get_total_years(date, scenarioId, connection) {
    const user_birth_year = await get_user_birth_year(scenarioId, connection);
    const user_life_expectancy = await get_user_life_expectancy(scenarioId, connection);
    const user_lifespan = await user_birth_year + user_life_expectancy;
    const filing_status = await get_filing_status(scenarioId, connection);


    if (filing_status === 'SINGLE') {
        // If filing status is single, return the user's lifespan minus the current year
        return user_lifespan - date;
    }

    // Calculate the spouse's lifespan
    const spouse_birth_year = get_spouse_birth_year(scenarioId, connection);
    const spouse_life_expectancy = get_spouse_life_expectancy(scenarioId, connection);
    const spouse_lifespan = spouse_birth_year + spouse_life_expectancy;

    // Return the greater of the two lifespans minus the current year
    if (user_lifespan >= spouse_lifespan) {
        return user_lifespan - date;
    }

    return spouse_lifespan - date;
}


/**
 * Placeholder for calculating statistics from the simulation results.
 */
export function calculate_stats(simulationResults) {
    console.log('Calculating statistics from simulation results');
    return {
        median: 0, 
        mean: 0, 
        otherInfo: {}, 
    };
}

export async function get_user_birth_year(scenarioId, connection) {
    if (connection) {
        const query = `SELECT user_birth_year FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return results[0]?.user_birth_year || 0; // Return the birth year or 0 if not found
        } catch (error) {
            console.error("Error fetching user birth year:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function get_user_life_expectancy(scenarioId, connection) {
    if (connection) {
        const query = `SELECT user_life_expectancy_value FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return results[0]?.user_life_expectancy_value || 0; // Return the life expectancy or 0 if not found
        } catch (error) {
            console.error("Error fetching user life expectancy:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function get_spouse_birth_year(scenarioId, connection) {
    if (connection) {
        const query = `SELECT spouse_birth_year FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return results[0]?.spouse_birth_year || 0; // Return the spouse's birth year or 0 if not found
        } catch (error) {
            console.error("Error fetching spouse birth year:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function get_spouse_life_expectancy(scenarioId, connection) {
    if (connection) {
        const query = `SELECT spouse_life_expectancy_value FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return results[0]?.spouse_life_expectancy_value || 0; // Return the life expectancy or 0 if not found
        } catch (error) {
            console.error("Error fetching spouse life expectancy:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function get_filing_status(scenarioId, connection) {
    if (connection) {
        const query = `SELECT filing_status FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return results[0]?.filing_status || ""; // Return the filing status or an empty string if not found
        } catch (error) {
            console.error("Error fetching filing status:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return ""; // Return an empty string if connection is not available
}
