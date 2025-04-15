import mysql from "mysql2/promise";

/**
 * How to use:
 *    const connection = await pool.getConnection();
 *
 * How to close:
 *    connection.release();
 *
 * Always release() the connection after using.
 *
 * TP: ChatGPT, prompt: "now i am getting this error: Failed to insert user scenario info: Error: Can't add new command when connection is in closed state"
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // port: process.env.DB_PORT,
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
