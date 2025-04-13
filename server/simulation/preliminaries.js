
/**
 * Fetches necessary preliminary data from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Object} The preliminary data, including inflation assumptions.
 */
export async function get_preliminaries_data(scenarioId, connection) {
    // Query the database to fetch inflation assumptions and other necessary data
    // this would be different from guest 

    const [rows] = await connection.execute(
        `SELECT 
            inflation_assumption_type AS type,
            inflation_assumption_value AS value,
            inflation_assumption_mean AS mean,
            inflation_assumption_stdev AS std_dev,
            inflation_assumption_lower AS lower,
            inflation_assumption_upper AS upper
         FROM user_scenario_info
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

export async function run_preliminaries(current_simulation_year, scenarioId, connection) {
    // console.log("Running preliminaries for year:", current_simulation_year);
    const inflation_assumption = await get_preliminaries_data(scenarioId, connection);
    // console.log("Inflation assumption data:", inflation_assumption);

    const inflation_rate = sample(inflation_assumption);

    // console.log("Sampled inflation rate for the current year:", inflation_rate);

    return inflation_rate;
}





/**
 * Sample a value from a distribution or fixed amount. 
 * Used for: If the inflation assumption uses a probability distribution, 
 * sample from that distribution and store the result as the current year,
 * inflation rate, for use in all inflation-related calculations for the year.
 */

export function sample(item) {
    let result;

    // console.log(`Sampling item: ${JSON.stringify(item)}, of type: ${item.type}`);
    switch (item.type) {
        case "fixed":
            // Use the fixed inflation rate
            result = Number(item.value);
            break;

        case "normal_distribution":
            // Sample from a normal distribution
            result = sample_normal_distribution(
                Number(item.mean),
                Number(item.std_dev)
            );
            break;

        case "uniform_distribution":
            // Sample from a uniform distribution
            result = sample_uniform_distribution(
                Number(item.upper),
                Number(item.lower)
            );
            break;

        default:
            throw new Error("Invalid type");
    }

    // console.log("Resulting value of sampling:", result);
    return result;
}

/**
 * Samples a value from a normal distribution using the Box-Muller transform.
 */
export function sample_normal_distribution(mean, std_dev) {
    // console.log("Sampling normal distribution with mean:", mean, "and std_dev:", std_dev);
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
export function sample_uniform_distribution(min, max) {
    // console.log("Sampling uniform distribution with min:", min, "and max:", max);
    if (min >= max) {
        throw new Error("Minimum value must be less than the maximum value.");
    }

    return Math.random() * (max - min) + min;
}

