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
  for (const rebalanceEvent of rebalanceEvents) {
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
      const investment = runningTotals.investments.find(
        (inv) => inv.id === investmentId
      );
      totalPortfolioValue += Number(investment?.value || 0);
    }

    // Step 2: Process sales of investments
    for (const investmentId in assetAllocation) {
      const investment = runningTotals.investments.find(
        (inv) => inv.id === investmentId
      );

      if (!investment) continue;

      const targetValue =
        Math.round(totalPortfolioValue * assetAllocation[investmentId] * 100) /
        100;

      if (investment.value > targetValue) {
        // Calculate the amount to sell
        const amountToSell = investment.value - targetValue;

        // Calculate capital gains if the tax status is not "pre-tax non-retirement"
        if (investment.taxStatus !== "pre-tax non-retirement") {
          runningTotals.curYearGains =
            Math.round((runningTotals.curYearGains + amountToSell) * 100) / 100;
        }

        // Update the investment value after the sale
        investment.value = Number(investment.value) - amountToSell;
      } else if (investment.value < targetValue) {
        // Calculate the amount to buy
        const amountToBuy =
          Math.round((targetValue - investment.value) * 100) / 100;

        // Update the investment value after the purchase
        investment.value = Number(investment.value) + amountToBuy;

        // Update purchase prices
        const purchasePrice = Number(
          runningTotals.purchasePrices[investmentId]
        );

        const newPurchasePrice =
          Math.round((purchasePrice + amountToBuy) * 100) / 100;

        runningTotals.purchasePrices[investmentId] = newPurchasePrice;
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
