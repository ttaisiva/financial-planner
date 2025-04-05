const { process_income_event } = require('./run_income_events');

/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
function simulation(current_year, num_simulations, scenario) {
    const total_years = calculate_total_years(current_year, scenario);

    const simulation_results = [];

    for (let sim = 0; sim < num_simulations; sim++) {
        let yearly_results = [];

        for (let year = 0; year < total_years; year++) {
            const current_simulation_year = current_year + year;

            // Run income events
            process_income_event(current_simulation_year);

            // Perform required minimum distributions (RMDs)
          

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
 * Calculates the total number of years for the simulation based on the scenario.
 */
function calculate_total_years(current_year, scenario) {
    const user_lifespan = scenario.user_birth_year + scenario.user_life_expectancy;

    if (scenario.filing_status === 'SINGLE') {
        return user_lifespan - current_year;
    }

    const spouse_lifespan = scenario.spouse_birth_year + scenario.spouse_life_expectancy;

    if (user_lifespan >= spouse_lifespan) {
        return user_lifespan - current_year;
    }

    return spouse_lifespan - current_year;
}



/**
 * Placeholder for calculating statistics from the simulation results.
 */
function calculate_stats(simulationResults) {
    console.log('Calculating statistics from simulation results');
    return {
        median: 0, 
        mean: 0, 
        otherInfo: {}, 
    };
}

module.exports = { simulation, calculate_total_years };
