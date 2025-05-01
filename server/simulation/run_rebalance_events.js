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
  runningTotals
) {
  const rebalanceEventYears = await getEventYears(rebalanceEvents);
  console.log("rebalance event years: ", rebalanceEventYears);
  const purchasePrices = runningTotals.purchasePrices;

  for (const rebalanceEvent of rebalanceEvents) {
    const eventYears = rebalanceEventYears[rebalanceEvent.id];
    // console.log("YEAR OF EVENT: ", eventYears);
    if (!eventYears) continue;

    const { startYear, endYear } = eventYears;
    if (currentSimulationYear < startYear || currentSimulationYear > endYear)
      continue;

    const assetAllocation = rebalanceEvent.asset_allocation;
    // console.log("asset allocation: ", assetAllocation);
    if (!assetAllocation) continue;

    // Step 1: Calculate total value of relevant investments
    let totalPortfolioValue = 0;
    for (const investmentId in assetAllocation) {
      // console.log("investment id:", investmentId);
      // console.log("investments:", investments);
      totalPortfolioValue += Number(
        runningTotals.investments[investmentId]?.value || 0
      );
    }

    // Step 2: Calculate target values based on allocation
    const targetValues = {};
    for (const investmentId in assetAllocation) {
      targetValues[investmentId] =
        totalPortfolioValue * assetAllocation[investmentId];
    }

    // Step 3: Sell from over-allocated investments first
    for (const investmentId in targetValues) {
      const currentValue = Number(
        runningTotals.investments[investmentId]?.value || 0
      );
      const targetValue = targetValues[investmentId];

      if (currentValue > targetValue) {
        const amountToSell = currentValue - targetValue;

        // Capital gains (if not pre-tax)
        if (runningTotals.investments[investmentId].taxStatus !== "pre-tax") {
          const purchaseValue = Number(purchasePrices[investmentId] || 0);
          const costBasis = (purchaseValue / currentValue) * amountToSell;
          const capitalGain = amountToSell - costBasis;
          runningTotals.curYearGains += capitalGain;
        }

        // Update purchase prices proportionally
        const prevPurchase = Number(purchasePrices[investmentId] || 0);
        const remainingValue = currentValue - amountToSell;
        purchasePrices[investmentId] =
          remainingValue > 0
            ? (prevPurchase * (remainingValue / currentValue)).toFixed(2)
            : "0.00";

        // Apply the sale
        runningTotals.investments[investmentId].value = targetValue.toFixed(2);
      }
    }

    // Step 4: Buy into under-allocated investments using remaining value
    for (const investmentId in targetValues) {
      const currentValue = Number(
        runningTotals.investments[investmentId]?.value || 0
      );
      const targetValue = targetValues[investmentId];

      if (currentValue < targetValue) {
        const amountToBuy = targetValue - currentValue;

        // Update investment value and purchase price
        runningTotals.investments[investmentId].value = targetValue.toFixed(2);

        const prevPurchase = Number(purchasePrices[investmentId] || 0);
        purchasePrices[investmentId] = (prevPurchase + amountToBuy).toFixed(2);
      }
    }
  }
}

export const getRebalanceEvents = async (scenarioId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'rebalance'",
    [scenarioId]
  );

  // console.log("rows", rows);
  return rows;
};
