// NEED TO USE:
// - check if active event series for current simulation year
// - if cash.value > event.max_cash, distribute among investments

import { ensureConnection, connection } from "../server.js";

export async function runInvestEvent(
  currentSimulationYear,
  scenarioId,
  investEventYears
) {}

/**
 * Check if the given year falls within the range of any event's duration.
 * Stops at the first matching event.
 *
 * @param {number} year - The year to check.
 * @param {Object} eventYears - The eventYears object containing events' start and end years.
 * @returns {string|null} - The ID of the first event where the year falls within the range of the event's duration, or null if no match.
 */
const getFirstEventForYear = (year, eventYears) => {
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
 * Randomly generate the start year between the lower and upper bounds
 *
 * @param {*} lower
 * @param {*} upper
 */
function generateUniformRandom(lower, upper) {
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

/**
 * Gets the start year for normal distribution events
 *
 * TP: ChatGpt, prompt - "there is also a "normal" type that represents normal distribution with this format:
 * {type: normal, mean: <number>, stdev: <number>} add a case where if type is "normal",
 * it will choose a random start year based on the mean and standard deviation. end year will be currentsimulationyear"
 *
 * @param {*} mean
 * @param {*} stdev
 * @returns
 */
function generateNormalRandom(mean, stdev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdev + mean;
}
