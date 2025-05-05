import {
  generateNormalRandom,
  generateUniformRandom,
  getEventYears,
  pool,
} from "../utils.js";
import { logInvest } from "../logging.js";

/**
 * Runs invest events for the durations they are active. Allocates excess cash to investements based on asset allocation info.
 *
 * @param {*} currentSimulationYear
 * @param {*} scenarioId
 * @param {*} investEventYears
 * @param {*} runningTotals
 * @param {*} inflationRate
 * @param {*} afterTaxContributionLimit
 * @param {*} date
 */
export async function runInvestEvent(
  currentSimulationYear,
  scenarioId,
  investEventYears,
  runningTotals,
  inflationRate,
  afterTaxContributionLimit,
  date,
  evtlog
) {
  const activeEventId = getActiveEventId(
    currentSimulationYear,
    investEventYears
  );
  // If there is an invest event that is active on the currentSimulationYear
  if (activeEventId) {
    const [rows] = await pool.execute(
      "SELECT max_cash FROM events WHERE id = ?",
      [activeEventId]
    );

    const maxCash = rows[0]?.max_cash; // safely access max_cash if row exists

    if (runningTotals.cashInvestment > maxCash) {
      const excessCash = runningTotals.cashInvestment - maxCash;
      runningTotals.cashInvestment =
        Number(runningTotals.cashInvestment) - Number(excessCash);
      const allocations = await getAssetAllocations(activeEventId);
      const event = await getEventById(activeEventId);

      if (event.glide_path === 1) {
        applyGlideAssetAllocation({
          allocations: allocations,
          amountToAllocate: excessCash,
          eventId: activeEventId,
          currentYear: currentSimulationYear,
          investEventYears,
          inflationRate,
          baseRetirementLimit: afterTaxContributionLimit,
          simulationStartYear: date,
          runningTotals,
        });
      } else {
        applyFixedAssetAllocation({
          allocations: allocations,
          amountToAllocate: excessCash,
          eventId: activeEventId,
          currentYear: currentSimulationYear,
          investEventYears,
          inflationRate,
          baseRetirementLimit: afterTaxContributionLimit,
          simulationStartYear: date,
          runningTotals,
        });
      }
    }
  }
}

const getEventById = async (eventId) => {
  const [rows] = await pool.execute("SELECT * FROM events WHERE id = ?", [
    eventId,
  ]);

  return rows[0];
};

/**
 * Check if the given year falls within the range of any event's duration.
 * Stops at the first matching event.
 *
 * @param {number} year - The year to check.
 * @param {Object} eventYears - The eventYears object containing events' start and end years.
 * @returns {string|null} - The ID of the first event where the year falls within the range of the event's duration, or null if no match.
 */
const getActiveEventId = (year, eventYears) => {
  // Iterate over each event's start and end year
  for (const eventId in eventYears) {
    const { startYear, endYear } = eventYears[eventId];

    // Check if the year is within the range [startYear, endYear]
    if (year >= startYear && year <= endYear) {
      return eventId; // Return the first matching event ID
    }
  }

  return null; // Return null if no event matches the year
};

/**
 * Get event ids associated with the scenario id
 *
 * @param {*} scenarioId
 * @returns array of event ids
 */
export const getInvestEvents = async (scenarioId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'invest'",
    [scenarioId]
  );


  return rows;
};

/**
 *
 * @param {*} eventId
 * @returns
 */
export async function getAssetAllocations(eventId) {
  const [rows] = await pool.execute(
    "SELECT asset_allocation, asset_allocation2, glide_path FROM events WHERE id = ?",
    [eventId]
  );

  const event = rows[0];
  if (!event) {
    console.error("No event found with that ID.");
    return null;
  }

  const allocation = {
    asset_allocation:
      typeof event.asset_allocation === "string"
        ? JSON.parse(event.asset_allocation)
        : event.asset_allocation,
  };

  if (event.glide_path === 1 && event.asset_allocation2) {
    allocation.asset_allocation2 =
      typeof event.asset_allocation2 === "string"
        ? JSON.parse(event.asset_allocation2)
        : event.asset_allocation2;
  }

  return allocation;
}

/**
 *
 * @param {*} allocation
 * @param {*} amountToAllocate
 */
async function applyGlideAssetAllocation({
  allocations,
  amountToAllocate,
  eventId,
  currentYear,
  investEventYears,
  inflationRate = 0.03,
  afterTaxContributionLimit = 6500,
  simulationStartYear = 2023,
  runningTotals,
}) {
  const event = await getEventById(eventId);
  if (!event) {
    console.warn(`Event with id "${eventId}" not found.`);
    return;
  }

  let computedAllocation = {};

  // Step 1: Handle glide path logic
  if (event.glide_path === 1) {
    const glideYears = investEventYears[eventId];
    if (!glideYears) {
      console.warn(`Glide years not found for event "${eventId}".`);
      return;
    }

    const { startYear, endYear } = glideYears;
    const totalYears = endYear - startYear;
    const elapsedYears = Math.max(
      0,
      Math.min(currentYear - startYear, totalYears)
    );
    const t = totalYears === 0 ? 1 : elapsedYears / totalYears;

    for (const key in allocations.asset_allocation) {
      const start = allocations.asset_allocation[key] || 0;
      const end = allocations.asset_allocation2?.[key] || 0;
      computedAllocation[key] = start + t * (end - start);
    }
  } else {
    computedAllocation = allocations.asset_allocation;
  }

  // Step 2: Calculate inflation-adjusted retirement limit
  const yearDuration = currentYear - simulationStartYear;
  const adjustedLimit =
    afterTaxContributionLimit * Math.pow(1 + inflationRate, yearDuration);

  let remainingToAllocate = amountToAllocate;
  const uncappedAllocations = {};

  // Step 3: First pass — apply capped allocations
  for (const [investmentId, percent] of Object.entries(computedAllocation)) {
    const target = runningTotals.investments.find(
      (inv) => inv.id === investmentId
    );
    if (!target) {
      console.warn(`Investment with id "${investmentId}" not found.`);
      continue;
    }

    const proposedAmount = amountToAllocate * percent;
    const currentValue = parseFloat(target.value) || 0;

    if (target.taxStatus === "after-tax") {
      const availableRoom = Math.max(adjustedLimit, 0); // Expandable: subtract already contributed this year
      const cappedAmount = Math.min(proposedAmount, availableRoom);

      const newValue = (currentValue + cappedAmount).toFixed(2);
      target.value = newValue;
      remainingToAllocate -= cappedAmount;

      // Update the matching purchase price
      if (runningTotals.purchasePrices.hasOwnProperty(target.id)) {
        runningTotals.purchasePrices[target.id] = newValue;
      }

      if (proposedAmount > cappedAmount) {
        uncappedAllocations[investmentId] = 0;
      }
    } else {
      uncappedAllocations[investmentId] = percent;
    }
  }

  // Step 4: Redistribute leftover amount proportionally
  const totalUncappedWeight = Object.values(uncappedAllocations).reduce(
    (sum, p) => sum + p,
    0
  );

  for (const [investmentId, percent] of Object.entries(uncappedAllocations)) {
    if (percent === 0) continue;

    const target = runningTotals.investments.find(
      (inv) => inv.id === investmentId
    );
    if (!target) continue;

    const currentValue = parseFloat(target.value) || 0;
    const weight = percent / totalUncappedWeight;
    const reallocAmount = remainingToAllocate * weight;

    const newValue = (currentValue + reallocAmount).toFixed(2);
    target.value = newValue;

    // Update the matching purchase price
    if (runningTotals.purchasePrices.hasOwnProperty(target.id)) {
      runningTotals.purchasePrices[target.id] = newValue;
    }
  }
}

/**
 *
 * @param {*} param0
 * @returns
 */
async function applyFixedAssetAllocation({
  allocations,
  amountToAllocate,
  eventId,
  currentYear,
  inflationRate = 0.03,
  afterTaxContributionLimit = 6500,
  simulationStartYear = 2023,
  runningTotals,
}) {
  const event = await getEventById(eventId);
  if (!event) {
    console.warn(`Event with id "${eventId}" not found.`);
    return;
  }

  const computedAllocation = allocations.asset_allocation;
  if (!computedAllocation) {
    console.warn(`No asset_allocation found for event "${eventId}".`);
    return;
  }

  // Step 1: Calculate inflation-adjusted after-tax contribution limit
  const yearDuration = currentYear - simulationStartYear;
  const adjustedLimit =
    afterTaxContributionLimit * Math.pow(1 + inflationRate, yearDuration);

  let remainingToAllocate = amountToAllocate;
  const uncappedAllocations = {};

  // Step 2: Apply allocations with after-tax cap enforcement
  for (const [investmentId, percent] of Object.entries(computedAllocation)) {
    const target = runningTotals.investments.find(
      (inv) => inv.id === investmentId
    );
    if (!target) {
      console.warn(`Investment with id "${investmentId}" not found.`);
      continue;
    }

    const proposedAmount = amountToAllocate * percent;
    const currentValue = parseFloat(target.value) || 0;

    if (target.taxStatus === "after-tax") {
      const availableRoom = Math.max(adjustedLimit, 0);
      const cappedAmount = Math.min(proposedAmount, availableRoom);

      const newValue = (currentValue + cappedAmount).toFixed(2);
      target.value = newValue;
      remainingToAllocate -= cappedAmount;

      // Update the matching purchase price
      if (runningTotals.purchasePrices.hasOwnProperty(target.id)) {
        runningTotals.purchasePrices[target.id] = newValue;
      }

      if (proposedAmount > cappedAmount) {
        uncappedAllocations[investmentId] = 0;
      }
    } else {
      uncappedAllocations[investmentId] = percent;
    }
  }

  // Step 3: Redistribute leftover to uncapped investments
  const totalUncappedWeight = Object.values(uncappedAllocations).reduce(
    (sum, p) => sum + p,
    0
  );

  for (const [investmentId, percent] of Object.entries(uncappedAllocations)) {
    if (percent === 0 || totalUncappedWeight === 0) continue;

    const target = runningTotals.investments.find(
      (inv) => inv.id === investmentId
    );
    if (!target) continue;

    const currentValue = parseFloat(target.value) || 0;
    const weight = percent / totalUncappedWeight;
    const reallocAmount = remainingToAllocate * weight;

    const newValue = (currentValue + reallocAmount).toFixed(2);
    target.value = newValue;

    // Update the matching purchase price
    if (runningTotals.purchasePrices.hasOwnProperty(target.id)) {
      runningTotals.purchasePrices[target.id] = newValue;
    }
  }
}
