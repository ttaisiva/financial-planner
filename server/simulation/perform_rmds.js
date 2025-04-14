// Perform the RMD for the previous year, if the user’s age is at least 74 and at the end of the previous
// year, there is at least one investment with tax status = “pre-tax” and with a positive value.
// a. The first RMD is for the year in which the user turns 73, and is paid in the year in which the user
// turns 74.
// b. Distribution period d = result from lookup of the user’s age in the most recent available RMD table
// (typically the current actual year’s RMD table).
// c. s = sum of values of the investments with tax status = pre-tax, as of the end of the previous year.
// (don’t look for “IRA” in the name of the investment type. employer-sponsored pre-tax retirement
// accounts are not IRAs.)
// d. rmd = s / d
// e. curYearIncome += rmd
// f. Iterate over the investments in the RMD strategy in the given order, transferring each of them in-
// kind to an investment with the same investment type and with tax status = “non-retirement”, until
// the total amount transferred equals rmd. The last investment to be transferred might be partially
// transferred.
// g. “Transferring in-kind” means reducing the value of the source investment by the transferred
// amount, checking whether an investment with the same investment type and target tax status
// already exists, and if so, adding the transferred amount to its value, otherwise creating an
// investment with the same investment type, the target tax status, and value equal to the transferred amount.

import { connection, ensureConnection } from "../server.js";
import { getUserBirthYear } from "./monte_carlo_sim.js";

/**
 * Performs the Required Minimum Distribution (RMD) for the previous year.
 * @param {Object} scenarioId - The scenario ID.
 * @param {number} currentSimulationYear - The current simulation year.
 * @param {number} curYearIncome - The current year's income total.
 * @returns {Object} Updated investments and curYearIncome after performing RMDs.
 */
export async function performRMDs(
  scenarioId,
  currentSimulationYear,
  curYearIncome
) {
  console.log(
    `Starting RMD process for scenario ID: ${scenarioId}, year: ${currentSimulationYear}`
  );

  // Step a: Get the user's birth year and calculate their age
  const userBirthYear = await getUserBirthYear(scenarioId, connection);
  const userAge = currentSimulationYear - userBirthYear;
  console.log(`User birth year: ${userBirthYear}, current age: ${userAge}`);

  // Check if the user is at least 74 and has pre-tax investments
  if (userAge < 73) {
    console.log(`No RMD required for user age ${userAge}.`);
    return { curYearIncome }; // No RMD required
  }

  console.log(`User is eligible for RMD. Fetching pre-tax investments...`);

  // Step b: Fetch pre-tax investments
  const preTaxInvestments = await getPreTaxInvestments(scenarioId, connection);
  console.log(`Found ${preTaxInvestments.length} pre-tax investments.`);

  if (preTaxInvestments.length === 0) {
    console.warn("No pre-tax investments found. Skipping RMD process.");
    return { curYearIncome }; // No pre-tax investments
  }

  // Step c: Lookup distribution period (d) from the RMD table
  console.log(`Fetching RMD distribution period for age ${userAge}...`);
  const rmdTable = await getRMDTable(connection);
  const distributionPeriod = rmdTable[userAge];
  if (!distributionPeriod) {
    console.error(`No distribution period found for age ${userAge}.`);
    throw new Error(`No distribution period found for age ${userAge}`);
  }
  console.log(`Distribution period for age ${userAge}: ${distributionPeriod}`);

  // Step d: Calculate the sum of pre-tax investment values (s)
  const totalPreTaxValue = preTaxInvestments.reduce(
    (sum, inv) => sum + Number(inv.value),
    0
  );
  console.log(`Total pre-tax investment value: ${totalPreTaxValue}`);

  // Step e: Calculate the RMD (rmd = s / d)
  let rmd = totalPreTaxValue / Number(distributionPeriod);
  rmd = Math.round(rmd * 100) / 100; // Round to 2 decimal places
  console.log(`Calculated RMD: ${rmd}`);

  // Step f: Add RMD to curYearIncome
  curYearIncome += Number(rmd);
  console.log(`Updated curYearIncome after adding RMD: ${curYearIncome}`);

  // Step g: Transfer investments in-kind to non-retirement accounts
  let remainingRMD = Number(rmd);
  console.log(`Starting in-kind transfer of investments to satisfy RMD...`);

  try {
    // Start a database transaction

    for (const inv of preTaxInvestments) {
      if (remainingRMD <= 0) break;

      const transferAmount = Math.min(Number(inv.value), remainingRMD);
      remainingRMD -= transferAmount;

      console.log(
        `Transferring $${transferAmount} from investment ID ${inv.id}. Remaining RMD: ${remainingRMD}`
      );

      await connection.beginTransaction();
      // Reduce the value of the source investment
      await connection.execute(
        "UPDATE investments SET value = value - ? WHERE id = ?",
        [transferAmount, inv.id]
      );

      // Check if a non-retirement investment with the same type exists
      const [targetRows] = await connection.execute(
        "SELECT * FROM investments WHERE investment_type = ? AND tax_status = 'Non-Retirement' AND scenario_id = ?",
        [inv.investment_type, scenarioId]
      );
      console.log(
        `Query result for investment_type=${inv.investment_type}, scenario_id=${scenarioId}:`,
        targetRows
      );

      if (targetRows.length > 0) {
        // Add the transferred amount to the existing non-retirement investment
        const targetInvestment = targetRows[0];
        console.log(
          `Adding $${transferAmount} to existing non-retirement investment ID ${targetInvestment.id}.`
        );
        await connection.execute(
          "UPDATE investments SET value = value + ? WHERE id = ?",
          [transferAmount, targetInvestment.id]
        );
      } else {
        // Create a new non-retirement investment
        console.log(
          `Creating new non-retirement investment for type ${inv.investment_type} with value $${transferAmount}.`
        );
        await connection.execute(
          "INSERT INTO investments (investment_type, tax_status, value, scenario_id) VALUES (?, 'Non-Retirement', ?, ?)",
          [inv.investment_type, transferAmount, scenarioId]
        );
      }

      await connection.commit();
      console.log("Transaction committed for this iteration.");
    }

    console.log("RMD process completed successfully.");
  } catch (err) {
    console.error("Failed to perform RMD transfers:", err);
    // Rollback the transaction in case of an error
    await connection.rollback();
    throw new Error("Failed to perform RMD transfers.");
  }

  // Return the updated investments and curYearIncome
  return { curYearIncome };
}

/**
 * Fetches the RMD table from the database.
 * @param {Object} connection - The database connection object.
 * @returns {Object} An object where the keys are ages and the values are distribution periods.
 */
export async function getRMDTable(connection) {
  console.log("Fetching RMD table from the database...");
  try {
    // Query the RMD table
    const [rows] = await connection.execute(
      `SELECT age, distribution_period FROM rmds ORDER BY age ASC`
    );

    // Convert the rows into an object for easy lookup
    const rmdTable = {};
    rows.forEach((row) => {
      rmdTable[row.age] = row.distribution_period;
    });

    console.log("RMD table fetched successfully.");
    return rmdTable;
  } catch (error) {
    console.error("Error fetching RMD table from the database:", error);
    throw new Error("Unable to fetch RMD table.");
  }
}

/**
 * Fetches all pre-tax investments for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Array} A list of pre-tax investments.
 */
export async function getPreTaxInvestments(scenarioId) {
  console.log(`Fetching pre-tax investments for scenario ID: ${scenarioId}`);

  try {
    const [rows] = await connection.execute(
      `SELECT 
                id, 
                investment_type, 
                value, 
                tax_status 
             FROM investments 
             WHERE scenario_id = ? AND tax_status = 'pre-tax' AND value > 0`,
      [scenarioId]
    );

    console.log(
      `Fetched ${rows.length} pre-tax investments for scenario ID: ${scenarioId}`
    );
    return rows; // Return the list of pre-tax investments
  } catch (error) {
    console.error(
      `Error fetching pre-tax investments for scenario ID: ${scenarioId}`,
      error
    );
    throw new Error("Unable to fetch pre-tax investments from the database.");
  }
}
