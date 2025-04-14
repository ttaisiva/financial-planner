// NEED TO USE:
// - check if active event series for current simulation year
// - if cash.value > event.max_cash, distribute among investments

import { ensureConnection } from "../server";

export function runInvestEvent(
  date,
  numSimulations,
  userId,
  scenarioId,
  connection
) {
  const eventIds = getEventIdsByScenarioId(scenarioId, connection);
  console.log("INVEST EVENT, event ids:", eventIds);
}

const getEventIdsByScenarioId = async (scenarioId, connection) => {
  const [rows] = await connection.execute(
    "SELECT id FROM events WHERE scenario_id = ?",
    [scenarioId]
  );

  await connection.end();

  // rows is an array of objects like [{ id: 1 }, { id: 2 }]
  return rows.map((row) => row.id); // extract only the IDs
};
