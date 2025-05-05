import {
  generateNormalRandom,
  generateUniformRandom,
  getEventYears,
  pool,
} from "../utils.js";

/**
 *
 * TP: ChatGPT, prompt - "now i need a new function that computes the target value of each investment,
 * and then adjust its amount by buying or selling, as appropriate. For each sale of an investment whose tax status is not “pre-tax retirement”,
 * calculate the capital gains on the sale and update curYearGains. In principle, I would first process all of the sales, and then all of the purchases."
 *
 * @param {*} rebalanceEvents
 * @param {*} runningTotals
 */
export async function runRebalanceEvents(
  currentSimulationYear,
  rebalanceEvents,
  rebalanceEventYears,
  runningTotals,
  evtlog
) {
  const purchasePrices = runningTotals.purchasePrices;

  for (const rebalanceEvent of rebalanceEvents) {
    console.log("Rebalance Event:", rebalanceEvent);
    const eventYears = rebalanceEventYears[rebalanceEvent.id];
    if (!eventYears) continue;

    const { startYear, endYear } = eventYears;
    if (currentSimulationYear < startYear || currentSimulationYear > endYear)
      continue;

    const assetAllocation = rebalanceEvent.asset_allocation;
    if (!assetAllocation) continue;

    // Step 1: Calculate total value of relevant investments
    let totalPortfolioValue = 0;
    for (const investmentId in assetAllocation) {
      // console.log("investment id:", investmentId);
      const investment = runningTotals.investments.find(
        (inv) => inv.id === investmentId
      );
      // console.log("Matching Investment:", investment);
      totalPortfolioValue += Number(investment?.value || 0);
    }

    // console.log("Total Portfolio Value:", totalPortfolioValue);

    // Step 2: Calculate target values based on allocation
    const targetValues = {};
    for (const investmentId in assetAllocation) {
      targetValues[investmentId] =
        totalPortfolioValue * assetAllocation[investmentId];
    }

    // Step 3: Update investments to match target values
    for (const investmentId in targetValues) {
      const targetValue = targetValues[investmentId];

      // Find the matching investment in the array
      const investment = runningTotals.investments.find(
        (inv) => inv.id === investmentId
      );

      if (investment) {
        // Update the value of the matching investment
        investment.value = targetValue;
      } else {
        console.error(`Investment with ID "${investmentId}" not found.`);
      }
    }
  }
}

export const getRebalanceEvents = async (scenarioId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'rebalance'",
    [scenarioId]
  );

  return rows;
};
