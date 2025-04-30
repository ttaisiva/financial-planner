import { ensureConnection, connection } from "../server.js";
import { generateNormalRandom, generateUniformRandom } from "../utils.js";

/**
 * Runs invest events for the durations they are active. Allocates excess cash to investements based on asset allocation info.
 *
 * @param {*} currentSimulationYear
 * @param {*} scenarioId
 * @param {*} investEventYears
 * @param {*} runningTotals
 * @param {*} investments
 * @param {*} inflationRate
 * @param {*} afterTaxContributionLimit
 * @param {*} date
 */
export async function runInvestEvent(
  currentSimulationYear,
  scenarioId,
  investEventYears,
  runningTotals,
  investments,
  inflationRate,
  afterTaxContributionLimit,
  date
) {
  const activeEventId = getActiveEventId(
    currentSimulationYear,
    investEventYears
  );
  console.log("****** INVEST EVENT ****** active event:", activeEventId);

  // If there is an invest event that is active on the currentSimulationYear
  if (activeEventId) {
    await ensureConnection();
    const [rows] = await connection.execute(
      "SELECT max_cash FROM events WHERE id = ?",
      [activeEventId]
    );

    const maxCash = rows[0]?.max_cash; // safely access max_cash if row exists

    console.log("Max cash for event:", maxCash);

    if (runningTotals.cashInvestment > maxCash) {
      const excessCash = runningTotals.cashInvestment - maxCash;
      runningTotals.cashInvestment =
        Number(runningTotals.cashInvestment) - Number(excessCash);
      const allocations = await getAssetAllocations(activeEventId);
      // console.log("allocation:", allocations);

      // console.log("APPLYING ALLOCATIONS");
      const event = await getEventById(activeEventId);

      if (event.glide_path === 1) {
        applyGlideAssetAllocation({
          investments,
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
          investments,
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
    } else {
      console.log("No excess cash available to allocate to investments");
    }
  }
}

const getEventById = async (eventId) => {
  await ensureConnection();
  // console.log("in geteventbyid eventid:", eventId);
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

  // console.log("rows", rows);

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
export const getInvestEventYears = async (events) => {
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
    console.log("Start Object: ", startObj);

    // Determine start year based on event type
    switch (startObj.type) {
      case "fixed":
        startYear = Number(startObj.value);
        break;

      case "normal":
        // console.log(`Normal Event ${event.id} mean:`, startObj.mean);
        // console.log(`Normal Event ${event.id} stdev:`, startObj.stdev);
        startYear = Math.round(
          generateNormalRandom(startObj.mean, startObj.stdev)
        );
        // console.log(`Normal Event ${event.id} start year:`, startYear);
        break;

      case "uniform":
        // console.log(`Uniform Event ${event.id} lower:`, startObj.lower);
        // console.log(`Uniform Event ${event.id} upper:`, startObj.upper);
        startYear = generateUniformRandom(startObj.lower, startObj.upper);
        // console.log(`Uniform Event ${event.id} start year:`, startYear);
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
            // the startYear for startWith event is the same as the referenced event's endYear
            startYear = Number(referencedStartObj.value);
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

      case "startsAfter":
        const referencedEventAfter = events.find(
          (e) => e.name === startObj.eventSeries
        );

        if (referencedEventAfter) {
          const referencedEndYear = endYears[referencedEventAfter.id];

          if (referencedEndYear) {
            // Start the current event after the referenced event's end year
            startYear = referencedEndYear + 1;
          } else {
            console.error(
              `Referenced event ${startObj.eventSeries} does not have a valid end year.`
            );
            continue;
          }
        } else {
          console.error(`Referenced event ${startObj.eventSeries} not found.`);
          continue;
        }
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
        const normalDuration = generateNormalRandom(
          durationObj.mean,
          durationObj.stdev
        );
        endYear = startYear + Math.round(normalDuration); // Round to the nearest year
        break;

      case "uniform":
        const uniformDuration = generateUniformRandom(
          durationObj.lower,
          durationObj.upper
        );
        endYear = startYear + Math.round(uniformDuration); // Round to the nearest year
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
 * TP: ChatGPT, prompt:
 *
 *    "for each key in the asset allocations, i want to retrieve the investment with the matching id from a list of elements.
 *    with that id, i want to add to the "value" key of that investment
 *
 *    now can you allocate a percentage of the amountToAllocate according to the values in the allocation?
 *    for example, "S&P 500 after-tax" would get 40% of the amountToAllocate, and  "S&P 500 non-retirement" would get 60%"
 *
 * @param {*} investments
 * @param {*} allocation
 * @param {*} amountToAllocate
 */
async function applyGlideAssetAllocation({
  investments,
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
  console.log("AFTER TAX LIMIT: ", adjustedLimit);

  let remainingToAllocate = amountToAllocate;
  const uncappedAllocations = {};

  // Step 3: First pass — apply capped allocations
  for (const [investmentId, percent] of Object.entries(computedAllocation)) {
    const target = investments.find((inv) => inv.id === investmentId);
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

    const target = investments.find((inv) => inv.id === investmentId);
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
 * TP: ChatGPT, prompt - "can you make a similar function but instead of glide path, it is a fixed percentage allocated to each investment.
 * for example, the event would only have the field asset_allocation but not asset_allocation2.
 * if asset_allocation is: {"S&P 500 after-tax": 0.4, "S&P 500 non-retirement": 0.6}
 * then apply 40% of excess cash to "S&P 500 after-tax" and 60% to the other.
 * inflation assumptions are kept"
 *
 * @param {*} param0
 * @returns
 */
async function applyFixedAssetAllocation({
  investments,
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
  console.log("Inflation-adjusted after-tax limit: ", adjustedLimit);

  let remainingToAllocate = amountToAllocate;
  const uncappedAllocations = {};

  // Step 2: Apply allocations with after-tax cap enforcement
  for (const [investmentId, percent] of Object.entries(computedAllocation)) {
    const target = investments.find((inv) => inv.id === investmentId);
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

    const target = investments.find((inv) => inv.id === investmentId);
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
