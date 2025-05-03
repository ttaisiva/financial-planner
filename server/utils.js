import dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";
dotenv.config({ path: path.resolve("../.env") });
dotenv.config();

/**
 * How to use:
 *    await pool.query
 *    OR
 *    await pool.execute
 *    OR
 *    const connection = await pool.getConnection()
 *
 * If using getConnection(), make sure to to release it after using it: connection.release()
 * Otherwise, the pool handles releasing automatically
 *
 * TP: ChatGPT, prompt: "now i am getting this error: Failed to insert user scenario info: Error: Can't add new command when connection is in closed state"
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Converts a string from Camel Case to Snake Case.
 *
 * Used as a helper function for keysToSnakeCase.
 *
 * TP: ChatGPT, prompt - "how to insert data into a database with sanitization and converting camelcase to snakecase"
 * @param {String} str
 * @returns
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts keys in an object to Snake Case and sanitizes (replaces undefined values with null).
 *
 * TP: ChatGPT, prompt - "how to insert data into a database with sanitization and converting camelcase to snakecase"
 * @param {Object} obj
 * @returns
 */
export function keysToSnakeCase(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [camelToSnake(key), val ?? null])
  );
}

/**
 * Use for inserting strategies
 *
 * @param {*} val
 * @returns
 */
export const sanitizeToNull = (val) => {
  if (val === undefined || val === null) return null;
  if (Array.isArray(val) && val.length === 0) return null;
  if (typeof val === "number" && isNaN(val)) return null;
  if (typeof val === "string" && val.trim() === "") return null;
  return val;
};

/**
 * Use for eventsLocalStorage get rid of id before sending to database in create-scenario
 */
export function removeIdsFromEvents(events) {
  events.forEach((event) => {
    delete event.id; // Removes the 'id' property from each event
  });
  return events;
}

/**
 * Generates a value for uniform distribution
 * @param {*} lower
 * @param {*} upper
 */
export function generateUniformRandom(lower, upper) {
  lower = Number(lower);
  upper = Number(lower);

  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

/**
 * Generates a value for normal distribution
 *
 * TP: ChatGpt, prompt - "there is also a "normal" type that represents normal distribution with this format:
 * {type: normal, mean: <number>, stdev: <number>} add a case where if type is "normal",
 * it will choose a random start year based on the mean and standard deviation. end year will be currentsimulationyear"
 *
 * @param {*} mean
 * @param {*} stdev
 * @returns
 */
export function generateNormalRandom(mean, stdev) {
  mean = Number(mean);
  stdev = Number(stdev);

  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const raw = z0 * stdev + mean;
  const result = Math.max(0, Math.round(raw)); // ensures it's not negative
  console.log("result: ", result);
  return result;
}

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
export const getEventYears = async (events) => {
  const eventYears = {}; // Renamed from startYears
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

      case "normal":
        startYear = Math.round(
          generateNormalRandom(startObj.mean, startObj.stdev)
        );
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
            // the startYear for startWith event is the same as the referenced event's start year
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
    for (const [otherEventId, otherEventData] of Object.entries(eventYears)) {
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
    eventYears[event.id] = { startYear, endYear };
    endYears[event.id] = endYear; // Store the end year of this event for future checks
  }

  console.log("Event years (start and end) for all events:", eventYears);
  return eventYears;
};
