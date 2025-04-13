import { process_income_event } from './run_income_events.js';
import { run_preliminaries, sample } from './preliminaries.js';
import { performRMDs } from './perform_rmds.js';
import { getIncomeEvents } from './run_income_events.js';
import { updateInvestments } from './update_investments.js';
import { runRothOptimizer } from './roth_optimizer.js';
import { payNondiscExpenses } from './nondisc_expenses.js';
import { payDiscExpenses } from './disc_expenses.js';
import { getRothYears } from './roth_optimizer.js';
import { getRothStrategy } from './roth_optimizer.js';
import { initLogs } from '../logging.js';
import { log } from '../logging.js';
import { ensureConnection, connection } from "../server.js";
/**
 * Runs the Monte Carlo simulation for a given number of simulations.
 */
export async function simulation(date , numSimulations, userId, scenarioId, connection) { 
    console.log("Running Monte Carlo simulation...");
    const csvlog = await initLogs(userId); // open log file for writing
    const totalYears = await getTotalYears(date, scenarioId, connection);

    const simulationResults = [];

    for (let sim = 0; sim < numSimulations; sim++) {
        console.log("Running simulation number: ", sim);
        let yearlyResults = [];
        let previousYearAmounts = {}; // Placeholder for previous year amounts for income events
        let inflationRate;
        let isUserAlive = true;
        let isSpouseAlive = true;
        let cashInvestment = 0; //this dani is working on in new scenario -> need to get this from db.
        let curYearIncome = 0;
        let curYearSS = 0;
        const incomeEvents = await getIncomeEvents(scenarioId, []); // Fetch income events to determine the number of events
        const rothYears = await getRothYears(scenarioId);
        let rothStrategy = await getRothStrategy(scenarioId); // to avoid repetitive fetching in loop

        console.log("Initializing simulation investments.");
        let investments = await initInvestments(scenarioId); // Initialize investments for the scenario
        
        console.log("Total years for simulation: ", totalYears);
        for (let year = 0; year < totalYears; year++) { //years in which the simulation is  being run
            
            const currentSimulationYear = date + year; //actual year being simulated
            if(sim===0) log(csvlog, investments, currentSimulationYear-1);


            //Step 0: run preliminaries -> need to further implement this
            const inflationRate = await run_preliminaries(currentSimulationYear, scenarioId, connection);
            console.log("Inflation rate for year ", currentSimulationYear, " is: ", inflationRate);
            
            if (year === 0) {
                // Populate the object with initial amounts based on event IDs
                if(incomeEvents.length === 0) {
                    console.log("No income events found for this scenario.");
                    
                } else {
                incomeEvents.forEach(event => {
                    previousYearAmounts[event.id] = event.initialAmount || 0; // Use initialAmount or default to 0
                    console.log("Previous year amounts for income events: ", previousYearAmounts);
                });
                }
                
            }

            // Step 1: Run income events
            // let updatedAmounts;
            // ({
            //     updatedAmounts,
            //     cashInvestment,
            //     curYearIncome,
            //     curYearSS,
            // } = await process_income_event(
            //     scenarioId,
            //     previousYearAmounts,
            //     inflationRate,
            //     isUserAlive,
            //     isSpouseAlive,
            //     cashInvestment,
            //     curYearIncome,
            //     curYearSS
            // ));

            // Step 2: Perform required minimum distributions (RMDs) -> round these to nearest hundredth
            //({ curYearIncome } = await performRMDs(scenarioId, currentSimulationYear, curYearIncome));
          

            // Step 3: Optimize Roth conversions
            if(rothYears && currentSimulationYear >= rothYears.start_year && currentSimulationYear <= rothYears.end_year) {
                console.log(`Roth conversion optimizer enabled for years ${rothYears.start_year}-${rothYears.end_year}.`);
                const rothResult = await runRothOptimizer(scenarioId, rothStrategy, incomeEvents, investments);
                investments = rothResult.investments;
                rothStrategy = rothResult.rothStrategy;
            } else {
                console.log(`Roth conversion optimizer disabled for year ${currentSimulationYear}, skipping step 3.`);
            }

            // Step 4: Update investments
            // ({ curYearIncome } = await updateInvestments(scenarioId, curYearIncome ));
          

            // Pay non-discretionary expenses
            //payNondiscExpenses(scenarioId);

            // Pay discretionary expenses
            //payDiscExpenses(scenarioId);

            // Process investment events
       

            // Rebalance investments
        

            // Collect yearly results -> need to impelemnt this
            yearlyResults.push({
                year: currentSimulationYear,
                cash_flow: 0, 
                investments: 0,
            });
            
            if(sim==0) log(csvlog, investments, currentSimulationYear);
        }

        simulationResults.push(yearlyResults);
    }

    return calculateStats(simulationResults); // Calculate median, mean, and other statistics
}



/**
 * Calculates the total number of years for the simulation based on the user's and spouse's lifespans.
 * @param {number} date - starting year of simulation
 * @param {Object} scenario - The scenario object containing user and spouse details.
 * @returns {number} The total number of years for the simulation.
 */
export async function getTotalYears(date, scenarioId) {
    console.log("Date: ", date);
    await ensureConnection();
    const userBirthYear = Number(await getUserBirthYear(scenarioId, connection));
    console.log("User birth year: ", userBirthYear);
    const userLifeExpectancy = Number(await getUserLifeExpectancy(scenarioId, connection));
    console.log("User life expectancy: ", userLifeExpectancy);
    
    const userLifespan = userBirthYear + userLifeExpectancy;
    console.log("User lifespan: ", userLifespan);
    
    const filingStatus = await getFilingStatus(scenarioId, connection);
    console.log("Filing status: ", filingStatus);


    if (filingStatus === 'single') {
        // If filing status is single, return the user's lifespan minus the current year
        return userLifespan - date;
    }

    // Calculate the spouse's lifespan
    const spouseBirthYear = Number(await getSpouseBirthYear(scenarioId, connection));
    console.log("Spouse birth year: ", spouseBirthYear);
    const spouseLifeExpectancy = Number(await getSpouseLifeExpectancy(scenarioId, connection));
    console.log("Spouse life expectancy: ", spouseLifeExpectancy);
    
    const spouseLifespan = spouseBirthYear + spouseLifeExpectancy;
    console.log("Spouse lifespan: ", spouseLifespan);

    // Return the greater of the two lifespans minus the current year
    if (userLifespan >= spouseLifespan) {
        return userLifespan - date;
    }

    return spouseLifespan - date;
}


/**
 * Placeholder for calculating statistics from the simulation results.
 */
export function calculateStats(simulationResults) {
    console.log('Calculating statistics from simulation results');
    return {
        median: 0, 
        mean: 0, 
        otherInfo: {}, 
    };
}

async function initInvestments(scenarioId) {
    console.log("Fetching user-defined investments for the scenario.");
    await ensureConnection();
    const [rows] = await connection.execute(
        `SELECT 
            id,
            investment_type as type,
            dollar_value as dollarValue,
            tax_status as taxStatus
         FROM investments
         WHERE scenario_id = ?`,
        [scenarioId]
    );
    console.log("Simulation investments initialized.");
    return rows;
}

export async function getUserBirthYear(scenarioId) {
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


export async function getUserLifeExpectancy(scenarioId) {
    if (connection) {
        const query = `SELECT 
            user_life_expectancy_type AS type,
            user_life_expectancy_value AS value,
            user_life_expectancy_mean AS mean,
            user_life_expectancy_std_dev AS std_dev
        
        
            FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return sample(results[0])
            
        } catch (error) {
            console.error("Error fetching user life expectancy:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function getSpouseBirthYear(scenarioId) {
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

export async function getSpouseLifeExpectancy(scenarioId) {
    if (connection) {
        const query = `SELECT 
        spouse_life_expectancy_type,
        spouse_life_expectancy_value,
        spouse_life_expectancy_mean,
        spouse_life_expectancy_std_dev
    
        FROM user_scenario_info WHERE id = ?`;
        try {
            const [results] = await connection.execute(query, [scenarioId]);
            return sample(results[0])
        } catch (error) {
            console.error("Error fetching spouse life expectancy:", error);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    return 0; // Return 0 if connection is not available
}

export async function getFilingStatus(scenarioId) {
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
