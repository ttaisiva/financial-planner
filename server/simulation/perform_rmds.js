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
  evtlog
) {
  const userBirthYear = await getUserBirthYear(scenarioId, connection);
  const userAge = currentSimulationYear - userBirthYear;

  if (userAge < 73) {
    return;
  }

  const preTaxInvestments = await getPreTaxInvestments(runningTotals.investments);

  if (preTaxInvestments.length === 0) {
    console.warn("No pre-tax investments found. Skipping RMD process.");
    return;
  }

  const rmdTable = await getRMDTable(connection);
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

  runningTotals.curYearIncome = Number(runningTotals.curYearIncome) + Number(rmd);

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
        investment_type: inv.type,
        taxStatus: "non-retirement",
        value: 0,
      };
      runningTotals.investments.push(targetInvestment);
    }

    transfer(inv, targetInvestment, transferAmount);
  }
}

/**
 * Fetches the RMD table from the database.
 * @param {Object} connection - The database connection object.
 * @returns {Object} An object where the keys are ages and the values are distribution periods.
 */
export async function getRMDTable(connection) {
  try {
    const [rows] = await connection.execute(
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
