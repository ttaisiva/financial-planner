import { ensureConnection, connection } from "../server.js";
import { generateNormalRandom, generateUniformRandom } from "../utils.js";

/**
 *
 * TP: ChatGPT, prompt - "now i need a new function that computes the target value of each investment,
 * and then adjust its amount by buying or selling, as appropriate. For each sale of an investment whose tax status is not “pre-tax retirement”,
 * calculate the capital gains on the sale and update curYearGains. In principle, I would first process all of the sales, and then all of the purchases."
 *
 * @param {*} rebalanceEvents
 * @param {*} investments
 * @param {*} runningTotals
 */
export async function runRebalanceEvents(
  rebalanceEvents,
  investments,
  runningTotals
) {
  const purchasePrices = runningTotals.purchasePrices;

  for (const rebalanceEvent of rebalanceEvents) {
    const assetAllocation = rebalanceEvent.asset_allocation;
    if (!assetAllocation) continue;

    // Step 1: Calculate total value of relevant investments
    let totalPortfolioValue = 0;
    for (const investmentId in assetAllocation) {
      totalPortfolioValue += Number(investments[investmentId]?.value || 0);
    }

    // Step 2: Calculate target values based on allocation
    const targetValues = {};
    for (const investmentId in assetAllocation) {
      targetValues[investmentId] =
        totalPortfolioValue * assetAllocation[investmentId];
    }

    // Step 3: Sell from over-allocated investments first
    for (const investmentId in targetValues) {
      const currentValue = Number(investments[investmentId]?.value || 0);
      const targetValue = targetValues[investmentId];

      if (currentValue > targetValue) {
        const amountToSell = currentValue - targetValue;

        // Capital gains (if not pre-tax)
        if (investments[investmentId].taxStatus !== "pre-tax") {
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
        investments[investmentId].value = targetValue.toFixed(2);
      }
    }

    // Step 4: Buy into under-allocated investments using remaining value
    for (const investmentId in targetValues) {
      const currentValue = Number(investments[investmentId]?.value || 0);
      const targetValue = targetValues[investmentId];

      if (currentValue < targetValue) {
        const amountToBuy = targetValue - currentValue;

        // Update investment value and purchase price
        investments[investmentId].value = targetValue.toFixed(2);

        const prevPurchase = Number(purchasePrices[investmentId] || 0);
        purchasePrices[investmentId] = (prevPurchase + amountToBuy).toFixed(2);
      }
    }
  }
}

export const getRebalanceEvents = async (scenarioId) => {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'rebalance'",
    [scenarioId]
  );

  // console.log("rows", rows);
  return rows;
};
