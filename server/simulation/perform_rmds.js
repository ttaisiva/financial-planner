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

import { getUserBirthYear } from "./monte_carlo_sim.js";
import { transfer, getPreTaxInvestments } from "./preliminaries.js";
import { logRMD } from "../logging.js";
import { pool } from "../utils.js";

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
  evtlog
) {
  // Step a: Get the user's birth year and calculate their age
  const userBirthYear = await getUserBirthYear(scenarioId);
  const userAge = currentSimulationYear - userBirthYear;

  if (userAge < 73) {
    return; // No RMD required
  }

  const preTaxInvestments = await getPreTaxInvestments(
    runningTotals.investments
  );

  if (preTaxInvestments.length === 0) {
    console.warn("No pre-tax investments found. Skipping RMD process.");
    return; // No pre-tax investments
  }

  const rmdTable = await getRMDTable();
  const distributionPeriod = rmdTable[userAge];
  if (!distributionPeriod) {
    console.error(`No distribution period found for age ${userAge}.`);
    throw new Error(`No distribution period found for age ${userAge}`);
  }

  const totalPreTaxValue = preTaxInvestments.reduce(
    (sum, inv) => sum + Number(inv.value),
    0
  );

  let rmd = totalPreTaxValue / Number(distributionPeriod);
  rmd = Math.round(rmd * 100) / 100;

  // Step f: Add RMD to curYearIncome
  runningTotals.curYearIncome =
    Number(runningTotals.curYearIncome) + Number(rmd);

  let remainingRMD = Number(rmd);

  for (const inv of preTaxInvestments) {
    if (remainingRMD <= 0) break;

    const transferAmount = Math.min(Number(inv.value), remainingRMD);
    remainingRMD -= transferAmount;
    logRMD(evtlog, currentSimulationYear, inv.id, transferAmount);

    let targetInvestment = runningTotals.investments.find(
      (investment) =>
        investment.type === inv.type &&
        investment.taxStatus === "non-retirement"
    );

    if (!targetInvestment) {
      targetInvestment = {
        id: `${inv.type} non-retirement`,
        type: inv.type,
        taxStatus: "non-retirement",
        value: 0,
      };
      // console.log("in RMD: creating new target investment", targetInvestment);
      runningTotals.investments.push(targetInvestment);
    }

    transfer(inv, targetInvestment, transferAmount);
  }
}

/**
 * Fetches the RMD table from the database.
 * @returns {Object} An object where the keys are ages and the values are distribution periods.
 */
export async function getRMDTable() {
  try {
    // Query the RMD table
    const [rows] = await pool.execute(
      `SELECT age, distribution_period FROM rmds ORDER BY age ASC`
    );

    const rmdTable = {};
    rows.forEach((row) => {
      rmdTable[row.age] = row.distribution_period;
    });

    return rmdTable;
  } catch (error) {
    console.error("Error fetching RMD table from the database:", error);
    throw new Error("Unable to fetch RMD table.");
  }
}
