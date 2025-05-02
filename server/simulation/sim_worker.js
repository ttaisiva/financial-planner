import { simulation } from "./monte_carlo_sim.js";
import { parentPort } from "worker_threads";

// Script to listen for messages/tasks from the main thread
parentPort.on("message", async (data) => {
  const { date, numSimulations, userId, scenarioId } = data;

  try {
    // Run the monte carlo simulation simulation
    const result = await simulation(date, numSimulations, userId, scenarioId);

    console.log("worker computed result: ", result);

    // Send the result back to the main thread
    parentPort.postMessage({ success: true, result });
  } catch (error) {
    // Send the error back to the main thread
    console.error("❌ Worker simulation failed:", error);
    parentPort.postMessage({
      success: false,
      error: error.stack || error.message,
    });
  }
});
