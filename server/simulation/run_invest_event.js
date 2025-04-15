// NEED TO USE:
// - check if active event series for current simulation year
// - if cash.value > event.max_cash, distribute among investments

import { ensureConnection, connection } from "../server.js";
import { generateNormalRandom, generateUniformRandom } from "../utils.js";

export async function runInvestEvent(
  currentSimulationYear,
  scenarioId,
  investEventYears,
  cashInvestment,
  investments,
  inflationRate,
  afterTaxContributionLimit
) {
  const activeEventId = getActiveEventId(
    currentSimulationYear,
    investEventYears
  );
  console.log("active event:", activeEventId);

  // If there is an invest event that is active on the currentSimulationYear
  if (activeEventId) {
    await ensureConnection();
    const [rows] = await connection.execute(
      "SELECT max_cash FROM events WHERE id = ?",
      [activeEventId]
    );

    const maxCash = rows[0]?.max_cash; // safely access max_cash if row exists

    console.log("Max cash for event:", maxCash);

    if (cashInvestment > maxCash) {
      const excessCash = cashInvestment - maxCash;
      const allocations = await getAssetAllocations(activeEventId);
      console.log("allocation:", allocations);

      console.log("APPLYING ALLOCATIONS");

      applyAssetAllocationWithGlide({
        investments,
        allocations: allocations,
        amountToAllocate: excessCash,
        eventId: activeEventId,
        currentYear: currentSimulationYear,
        investEventYears,
        inflationRate,
        baseRetirementLimit: afterTaxContributionLimit,
      });
    } else {
      console.log("No excess cash available to allocate to investments");
    }
  }
}

const getEventById = async (eventId) => {
  await ensureConnection();
  console.log("in geteventbyid eventid:", eventId);
  const [rows] = await connection.execute("SELECT * FROM events WHERE id = ?", [
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
 * TP: ChatGpt, prompt - "{code here} how would i get the ids
 * of each event such that the scenario_id equals a specific int?
 * and how would i store them on server side?"
 *
 * @param {*} scenarioId
 * @returns array of event ids
 */
export const getInvestEvents = async (scenarioId) => {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT * FROM events WHERE scenario_id = ? AND type = 'invest'",
    [scenarioId]
  );

  console.log("rows", rows);

  await connection.end();

  return getInvestEventYears(rows);
};

/**
 * Gets the start year for each event in events
 *
 * TP: ChatGpt, prompt - "in the startYear object, make it so that it stores a start and end for each event.
 * if the event type = "fixed" the value (start year) will be the event value is the start year, and currentsimulationyear is the end year.
 * if event type = "uniform", the event.lower will be the start year and event.upper will be the end year
 * if event type = "startWith" it will take the start year from the event it references by name"
 *
 * @param {*} events
 * @returns Object {eventId: {startYear: int, endYear: int}}
 */
const getInvestEventYears = async (events) => {
  const investEventYears = {}; // Renamed from startYears
  const endYears = {}; // To keep track of the latest end year for each event.

  for (const event of events) {
    const startObj =
      typeof event.start === "string" ? JSON.parse(event.start) : event.start;
    const durationObj =
      typeof event.duration === "string"
        ? JSON.parse(event.duration)
        : event.duration;

    let startYear, endYear;

    // Determine start year based on event type
    switch (startObj.type) {
      case "fixed":
        startYear = Number(startObj.value);
        break;

      case "uniform":
        startYear = generateUniformRandom(startObj.lower, startObj.upper);
        break;

      case "startWith":
        const referencedEvent = events.find(
          (e) => e.name === startObj.eventSeries
        );

        if (referencedEvent) {
          const referencedStartObj =
            typeof referencedEvent.start === "string"
              ? JSON.parse(referencedEvent.start)
              : referencedEvent.start;

          if (referencedStartObj.type === "fixed") {
            // Ensure the startYear for startWith event is after the referenced event's endYear
            startYear = Number(referencedStartObj.value) + 1;
          } else {
            console.error(
              `Referenced event ${startObj.eventSeries} does not have a valid fixed start year.`
            );
            continue;
          }
        } else {
          console.error(`Referenced event ${startObj.eventSeries} not found.`);
          continue;
        }
        break;

      case "normal":
        startYear = Math.round(
          generateNormalRandom(startObj.mean, startObj.stdev)
        );
        break;

      default:
        console.error(`Unknown event type: ${startObj.type}`);
        continue;
    }

    // Ensure no overlapping of event durations
    for (const [otherEventId, otherEventData] of Object.entries(
      investEventYears
    )) {
      if (
        (startYear >= otherEventData.startYear &&
          startYear <= otherEventData.endYear) || // Overlapping check
        (startYear + 1 >= otherEventData.startYear &&
          startYear + 1 <= otherEventData.endYear)
      ) {
        // If overlap, adjust startYear to be after the other event's endYear
        startYear = otherEventData.endYear + 1;
        console.log(
          `Adjusted start year for event ${event.id} to avoid overlap.`
        );
      }
    }

    // Calculate end year based on duration
    switch (durationObj.type) {
      case "fixed":
        endYear = startYear + Number(durationObj.value);
        break;

      case "normal":
        const duration = generateNormalRandom(
          durationObj.mean,
          durationObj.stdev
        );
        endYear = startYear + Math.round(duration); // Round to the nearest year
        break;

      default:
        console.error(`Unknown duration type: ${durationObj.type}`);
        continue;
    }

    // Store the start and end year for the event
    investEventYears[event.id] = { startYear, endYear };
    endYears[event.id] = endYear; // Store the end year of this event for future checks
  }

  console.log("Event years (start and end) for all events:", investEventYears);
  return investEventYears;
};

/**
 *
 *
 * TP: ChatGPT, prompt - "asset_allocation field example:
 * {"S&P 500 after-tax": 0.4, "S&P 500 non-retirement": 0.6}
 * asset_allocation2 field example:
 * {"S&P 500 after-tax": 0.2, "S&P 500 non-retirement": 0.8}
 * get these field data from the events table given an id.
 * if glide_path field is true (equals 1), then asset_allocation2 is not null, and you must get asset_allocation2 data.
 * if glide_path field is null, then asset_allocatio2 is null - do not get asset_allocation2 data."
 *
 * @param {*} eventId
 * @returns
 */
export async function getAssetAllocations(eventId) {
  await ensureConnection();

  const [rows] = await connection.execute(
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
 * @param {*} investments
 * @param {*} allocation
 * @param {*} amountToAllocate
 */
async function applyAssetAllocationWithGlide({
  investments,
  allocations,
  amountToAllocate,
  eventId,
  currentYear,
  investEventYears,
  inflationRate = 0.02, // default 2%
  baseRetirementLimit = 6500, // base annual retirement contribution limit
}) {
  console.log("eventid:", eventId);
  const event = await getEventById(eventId);
  if (!event) {
    console.warn(`Event with id "${eventId}" not found.`);
    return;
  }

  let computedAllocation = {};

  // 1. Compute glide path allocation if needed
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
      const startPercent = allocations.asset_allocation[key] || 0;
      const endPercent = allocations.asset_allocation2?.[key] || 0;
      computedAllocation[key] = startPercent + t * (endPercent - startPercent);
    }
  } else {
    computedAllocation = allocations.asset_allocation;
  }

  // 2. Track how much has been added to retirement (after-tax) investments
  let retirementContributed = 0;
  const adjustedRetirementLimit = baseRetirementLimit * (1 + inflationRate);

  // 3. Apply allocation (respecting inflation-adjusted retirement limits)
  for (const [investmentId, percent] of Object.entries(computedAllocation)) {
    if (typeof percent !== "number" || isNaN(percent)) {
      console.warn(`Invalid percent for ${investmentId}:`, percent);
      continue;
    }

    const target = investments.find((inv) => inv.id === investmentId);
    if (!target) {
      console.warn(`Investment with id "${investmentId}" not found.`);
      continue;
    }

    const isRetirement = target.taxStatus === "after-tax";
    const currentValue = parseFloat(target.value);
    let allocationAmount = amountToAllocate * percent;

    // ⚠️ Adjust amount for inflation *before* contribution to retirement accounts
    if (isRetirement) {
      // Apply inflation to the dollar amount being contributed
      allocationAmount *= 1 + inflationRate;

      // Enforce annual limit
      const availableSpace = adjustedRetirementLimit - retirementContributed;
      if (allocationAmount > availableSpace) {
        allocationAmount = availableSpace;
      }

      retirementContributed += allocationAmount;
    }

    target.value = (currentValue + allocationAmount).toFixed(2);
  }
}
