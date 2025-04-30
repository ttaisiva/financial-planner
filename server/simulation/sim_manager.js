import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
import { calculateStats } from "./monte_carlo_sim.js";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Worker pool: the same worker threads are reused for multiple tasks, avoiding the overhead of creating and terminating tasks

const NUM_WORKERS = 4; 
const taskQueue = []; 
const workers = []; 
const workerStatus = []; 

// Initialize the worker pool
for (let i = 0; i < NUM_WORKERS; i++) {
  const worker = 
  new Worker(path.resolve(__dirname, "sim_worker.js")); 
  workers.push(worker);
  workerStatus.push(false); // busy=false
}

/**
 * Add a simulation task to the queue.
 * @param {Object} taskData - The data for the simulation task.
 * @returns {Promise} A promise that resolves with the simulation result.
 */
function addTaskToQueue(taskData) {
  // Call processQueue to assign tasks to available threads
  return new Promise((resolve, reject) => {
    taskQueue.push({ taskData, resolve, reject });
    processQueue(); 
  });
}

function processQueue() {
  if (taskQueue.length === 0) { // Exit if no tasks are in the queue
    return; 
  }
  const workerIndex = workerStatus.findIndex((status) => !status); // Find an idle worker
  if (workerIndex === -1) { // Exit if no workers are available
    return; 
  }
  const { taskData, resolve, reject } = taskQueue.shift(); // Get the next task from the queue
  workerStatus[workerIndex] = true; // Mark the worker as busy
  const worker = workers[workerIndex];

  // Resolve each task 
  worker.once("message", (message) => {
    workerStatus[workerIndex] = false; // Mark the worker as idle
    if (message.success) {
      resolve(message.result); // Resolve task with simulation result
    } else {
      reject(new Error(message.error));
    }
    processQueue(); // Process the next task in the queue
  });

  worker.once("error", (error) => {
    workerStatus[workerIndex] = false; // Mark the worker as idle
    reject(error);
    processQueue(); // Process the next task in the queue
  });

  worker.postMessage(taskData); // Send the task data to the worker
}

/**
 * Run multiple simulations in parallel.
 * For each sim create a task and push them to addTaskToQueue from there call 
 * processQueue to process all tasks, if threads are available the task is run
 * @param {Date} date - The date for the simulation.
 * @param {number} numSimulations - The number of simulations to run.
 * @param {string} userId - The user ID.
 * @param {string} scenarioId - The scenario ID.
 * @returns {Promise} A promise that resolves with the results of all simulations.
 */
export async function managerSimulation(date, numSimulations, userId, scenarioId) {
  console.log("RUNNING Monte Carlo simulation WITH parallelism.");

  // Question: should we do 1 worker per one simulation?
  const tasks = []; // Store all the tasks/simulations

  for (let i = 0; i < numSimulations; i++) {
    const taskData = {
      date,
      numSimulations: 1, // Each task runs one simulation
      userId,
      scenarioId,
    };

    // Each of the promises/results are collected in task array
    tasks.push(addTaskToQueue(taskData));
  }
  // Once all individual tasks/simulations are resolved, Promise.all aggregates all results
  const allSimulationResults = await Promise.all(tasks);
  // Aggregate results and calculate statistics
  const financialGoal = await getFinancialGoal(scenarioId); // Fetch the financial goal
  const stats = calculateStats(allSimulationResults, financialGoal);
  return stats;
}