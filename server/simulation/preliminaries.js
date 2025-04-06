const db = require('../db'); // Assuming you have a database connection module

/**
 * Fetches necessary preliminary data from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Object} The preliminary data, including inflation assumptions.
 */
async function get_preliminaries_data(scenarioId) {
    // Query the database to fetch inflation assumptions and other necessary data
    const [rows] = await db.execute(
        `SELECT 
            inflation_assumption_type AS type,
            inflation_assumption_value AS value,
            inflation_assumption_mean AS mean,
            inflation_assumption_std_dev AS std_dev,
            inflation_assumption_min AS lower,
            inflation_assumption_max AS upper
         FROM scenarios
         WHERE id = ?`,
        [scenarioId]
    );

    if (rows.length === 0) {
        throw new Error(`No data found for scenario ID: ${scenarioId}`);
    }

    return rows[0]; // Return the first row containing the inflation assumption data
}



/**
 * 
 * 1. Preliminaries
 * a. If the inflation assumption uses a probability distribution, sample from that distribution and store
 * the result as the current year inflation rate, for use in all inflation-related calculations for the year.
 * It’s simplest to do this before processing any events, so this value is available whenever it is first
 * needed.
 * b. Compute and store inflation-adjusted tax brackets for the current year. This needs to be done by
 * saving the tax brackets each year, and updating the previous year’s tax brackets using the current
 * year’s inflation rate. A formula like initAmount * (1 + inflation)^(#years) cannot be used when the
 * inflation rate can be selected from a probability distribution. Using such a formula is also slower.
 * c. Compute and store the inflation-adjusted annual limits on retirement account contributions, in a
 * similar way. -> maybe ask dani to do this?
 * 
 */

async function run_preliminaries(current_simulation_year, scenario) {
    const {
        
    } = await get_data_prelims(scenario.id);

    const inflation_rate = sample(scenario.inflation_assumption);

    

    return { inflation_rate };
}





/**
 * Sample a value from a distribution or fixed amount. 
 * Used for: If the inflation assumption uses a probability distribution, 
 * sample from that distribution and store the result as the current year,
 * inflation rate, for use in all inflation-related calculations for the year.
 */

function sample(item) {
    let result;

    switch (item.type) {
        case "fixed":
            // Use the fixed inflation rate
            result = item.value;
            break;

        case "normal_distribution":
            // Sample from a normal distribution
            result = sample_normal_distribution(
                item.mean,
                item.std_dev
            );
            break;

        case "uniform_distribution":
            // Sample from a uniform distribution
            result = sample_uniform_distribution(
                item.upper,
                item.lower
            );
            break;

        default:
            throw new Error("Invalid type");
    }

    return result;
}

/**
 * Samples a value from a normal distribution using the Box-Muller transform.
 */
function sample_normal_distribution(mean, std_dev) {
    if (std_dev <= 0) {
        throw new Error("Standard deviation must be greater than 0.");
    }

    const u1 = Math.random();
    const u2 = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u1 || 1e-10)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * std_dev;
}

/**
 * Samples a value from a uniform distribution.
 */
function sample_uniform_distribution(min, max) {
    if (min >= max) {
        throw new Error("Minimum value must be less than the maximum value.");
    }

    return Math.random() * (max - min) + min;
}

module.exports = { sample, sample_normal_distribution, sample_uniform_distribution, get_total_years };
