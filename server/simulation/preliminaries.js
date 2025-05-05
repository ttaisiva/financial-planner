import { generateNormalRandom, generateUniformRandom, pool } from "../utils.js";

/**
 * Fetches necessary preliminary data from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Object} The preliminary data, including inflation assumptions.
 */
export async function get_preliminaries_data(scenarioId) {
  // Query the database to fetch inflation assumptions and other necessary data
  // this would be different from guest

  const [rows] = await pool.execute(
    `SELECT 
            inflation_assumption
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

export async function run_preliminaries(scenarioId) {
  const result = await get_preliminaries_data(scenarioId);

  const inflation_rate = sample(result.inflation_assumption);

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

  switch (item.type) {
    case "fixed":
      // Use the fixed inflation rate
      result = Number(item.value);
      break;

    case "normal":
      // Sample from a normal distribution
      result = generateNormalRandom(Number(item.mean), Number(item.stdev));
      break;

    case "uniform":
      // Sample from a uniform distribution
      result = generateUniformRandom(Number(item.lower), Number(item.upper));
      break;

    default:
      throw new Error("Invalid type");
  }

  return result;
}

/**
 * Samples a value from a normal distribution using the Box-Muller transform.
 */
export function sample_normal_distribution(mean, stdev) {
  const u1 = Math.random();
  const u2 = Math.random();

  const z =
    Math.sqrt(-2.0 * Math.log(u1 || 1e-10)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdev;
}

/**
 * Samples a value from a uniform distribution.
 */
export function sample_uniform_distribution(max, min) {
  if (min >= max) {
    throw new Error("Minimum value must be less than the maximum value.");
  }

  return Math.floor(Math.random() * (max - min) + min);
}

export function transfer(investment1, investment2, amount) {
  if (investment1.value < amount) {
    throw new Error(
      `Insufficient funds in investment ${investment1.id}. Available: ${investment1.value}, Requested: ${amount}`
    );
  }

  // Perform the transfer
  investment1.value = Number(investment1.value) - Number(amount); // Deduct the amount from the source investment
  investment2.value = Number(investment2.value) + Number(amount); // Add the amount to the target investment
}

/**
 * Fetches all pre-tax investments for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {Array} investments - The list of investments for the simulation.
 * @returns {Array} A list of pre-tax investments.
 */
export async function getPreTaxInvestments(investments) {
  const results = [];
  for (const investment of investments) {
    if (investment.taxStatus === "pre-tax") {
      results.push(investment);
    }
  }

  return results; // Return the list of pre-tax investments
}
