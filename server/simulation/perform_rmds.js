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
import { transfer, getPreTaxInvestments } from "./preliminaries.js";
import { logRMD } from "../logging.js";

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
  runningTotals,
  investments,
  evtlog
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
    return ; // No RMD required
  }

  console.log(`User is eligible for RMD. Fetching pre-tax investments...`);

  // Step b: Fetch pre-tax investments
  console.log("My investments", investments);
  const preTaxInvestments = await getPreTaxInvestments(investments);

  console.log(`Found ${preTaxInvestments.length} pre-tax investments.`);

  if (preTaxInvestments.length === 0) {
    console.warn("No pre-tax investments found. Skipping RMD process.");
    return ; // No pre-tax investments
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
  runningTotals.curYearIncome = Number(runningTotals.curYearIncome) + Number(rmd);
  console.log(`Updated curYearIncome after adding RMD: ${runningTotals.curYearIncome}`);

  // Step g: Transfer investments in-kind to non-retirement accounts
  let remainingRMD = Number(rmd);
  console.log(`Starting in-kind transfer of investments to satisfy RMD...`);

  // Transfer investments from pre-tax to non-retirement accounts

  for (const inv of preTaxInvestments) {
    if (remainingRMD <= 0) break;

    const transferAmount = Math.min(Number(inv.value), remainingRMD);
    remainingRMD -= transferAmount;
    logRMD(evtlog, currentSimulationYear, inv.id, transferAmount);
    console.log(
      `Transferring $${transferAmount} from investment ID ${inv.id}. Remaining RMD: ${remainingRMD}`
    );

    // Check if a non-retirement investment with the same type exists
    let targetInvestment = investments.find(
      (investment) =>
        investment.type === inv.type &&
        investment.taxStatus === "non-retirement"
    );

    if (targetInvestment) {
      console.log("Target investment found with: ", targetInvestment);
    } else {
      //if not found make one
      console.log("Target investment not found. Creating new one.");
      // Create a new non-retirement investment
      targetInvestment = {
        id: `${inv.type} non-retirement`, 
        investment_type: inv.type,
        taxStatus: "non-retirement",
        value: 0,
      };
      investments.push(targetInvestment); // Add the new investment to the investments array
    }

    //update investment
    transfer(inv, targetInvestment, transferAmount);
  }

  console.log("RMD process completed.");


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
