// NEED TO USE:
// - check if active event series for current simulation year
// - if cash.value > event.max_cash, distribute among investments

import { ensureConnection, connection } from "../server.js";

export async function runInvestEvent(currentSimulationYear, scenarioId) {
  const eventIds = await getEventIds(scenarioId);
  console.log("INVEST EVENT, event ids:", eventIds);

  const startYears = getStartYears(eventIds);
}

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
const getEventIds = async (scenarioId) => {
  await ensureConnection();
  const [rows] = await connection.execute(
    "SELECT id FROM events WHERE scenario_id = ?",
    [scenarioId]
  );

  console.log("rows", rows);

  await connection.end();

  // rows is an array of objects like [{ id: 1 }, { id: 2 }]
  return rows.map((row) => row.id); // extract only the IDs
};

/**
 *
 * @param {*} eventIds
 */
const getStartYears = async (eventIds) => {
  await ensureConnection();
  const startData = await fetchStartData(eventIds);
  console.log("INVEST EVENT, start types:", startData);

  for (const [eventId, startObj] of Object.entries(startData)) {
    if (startObj.type === "fixed") {
      console.log(`Event ID ${eventId} has a fixed start`);
    }
    if (startObj.type === "normal_distribution") {
    } else {
      console.log(`Event ID ${eventId} has a non-fixed start:`, startObj.type);
    }
  }
};

/**
 *
 * TP: ChatGpt, prompt - "the event table has a field "start" with json data type that looks like this: {"type": "fixed", "value": "43"}
 * i want to retrieve the type values from the "start" field from the specified event ids given by the eventIds list, and then i want to
 * store it in server side. how do i do this?"
 *
 * @param {*} eventIds
 * @returns
 */
async function fetchStartData(eventIds) {
  await ensureConnection();

  const placeholders = eventIds.map(() => "?").join(",");
  const query = `SELECT id, start FROM events WHERE id IN (${placeholders})`;

  const [rows] = await connection.execute(query, eventIds);

  const startObjectMap = {};
  for (const row of rows) {
    try {
      const startObj =
        typeof row.start === "string" ? JSON.parse(row.start) : row.start;
      startObjectMap[row.id] = startObj;
    } catch (err) {
      console.error(`Failed to parse start JSON for event ID ${row.id}:`, err);
    }
  }

  console.log("Start objects fetched:", startObjectMap);
  return startObjectMap;
}
