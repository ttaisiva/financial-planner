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
