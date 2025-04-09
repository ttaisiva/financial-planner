import { process_income_event } from './run_income_events.js';
import { run_preliminaries } from './preliminaries.js';
import { performRMDs } from './perform_rmds.js';



/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export function simulation(date , num_simulations, userId, scenarioId, connection) { 
    const total_years = get_total_years(date, scenario);

    const simulation_results = [];


    for (let sim = 0; sim < num_simulations; sim++) {
        let yearly_results = [];
        let previousYearAmounts = []; // Placeholder for previous year amounts for income events
        let inflationRate;
        let isUserAlive = true;
        let isSpouseAlive = true;
        let cashInvestment = 0;
        let curYearIncome = 0;
        let curYearSS = 0;
        

        for (let year = 0; year < total_years; year++) { //years in which the simulation is  being run
            
            const currentSimulationYear = date + year; //actual year being simulated

            //run preliminaries -> need to further implement this
            const { inflationRate } = run_preliminaries(currentSimulationYear, scenarioId, connection);

            // Run income events
            process_income_event(scenarioId, previousYearAmounts, inflationRate, isUserAlive, isSpouseAlive, cashInvestment, curYearIncome, curYearSS);

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
export function get_total_years(date, scenario) {
    const user_lifespan = scenario.user_birth_year + scenario.user_life_expectancy;

    if (scenario.filing_status === 'SINGLE') {
        // If filing status is single, return the user's lifespan minus the current year
        return user_lifespan - date;
    }

    // Calculate the spouse's lifespan
    const spouse_lifespan = scenario.spouse_birth_year + scenario.spouse_life_expectancy;

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

