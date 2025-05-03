import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as monteCarlo from "../../server/simulation/monte_carlo_sim.js";
import { managerSimulation } from "../../server/simulation/sim_manager.js";

/**
 * TP: ChatGPT, prompt - "how would i make a test for the parallelism as shown in this code? [insert sim_manager.js and sim_worker.js code here]"
 */
describe("managerSimulation parallelism", () => {
  let originalSim;

  beforeEach(() => {
    // Spy on the real simulation function and wrap it with a delay
    originalSim = vi
      .spyOn(monteCarlo, "simulation")
      .mockImplementation(async (...args) => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        return { simulated: true, scenarioId: args[3] };
      });
  });

  afterEach(() => {
    originalSim.mockRestore(); // Restore the real function after the test
  });

  it("runs simulations in parallel (using worker threads)", async () => {
    const start = Date.now();

    const numSimulations = 6; // More than NUM_WORKERS (4)
    const result = await managerSimulation(
      new Date(),
      numSimulations,
      "1", // test user ID is 1
      "38" // scenario associated with test user
    );

    const durationSeconds = (Date.now() - start) / 1000;
    console.log(`Simulations completed in ${durationSeconds.toFixed(2)}s`);

    expect(result).toBeDefined();
    expect(result.totalSimulations).toBe(numSimulations);
    expect(result.allSimulationResults.length).toBe(numSimulations);
    expect(durationSeconds).toBeLessThan(4.5); // Serial would be ~6s
  });
});
