import React, { useState } from "react";
import { SurfacePlot, ContourPlot } from "../utilsPlots";

/**
 * Compiles 2D arrays for final probabilities of success and final median total investments.
 * @param {Object} simulationResults - The simulation results object.
 * @param {number} financialGoal - The financial goal to calculate probabilities of success.
 * @returns {Object} An object containing 2D arrays for probabilities and median investments.
 */
function compile2DResults(simulationResults, financialGoal) {
  const { results, param1Values, param2Values } = simulationResults;

  // Initialize 2D arrays for probabilities and median investments
  const probabilities2D = [];
  const medianInvestments2D = [];

  // Loop through param1Values (x-axis)
  for (let i = 0; i < param1Values.length; i++) {
    const probabilitiesRow = [];
    const medianInvestmentsRow = [];

    // Loop through param2Values (y-axis)
    for (let j = 0; j < param2Values.length; j++) {
      // Calculate the index in the allSimulationResults array
      const simulationIndex = i * param2Values.length + j;

      // Get all simulations for this parameter combination
      const simulations = results.allSimulationResults[simulationIndex]?.[0];

      if (simulations) {
        // Calculate the probability of success
        const successCount = simulations.filter(
          (simulation) => simulation.cashInvestment >= financialGoal
        ).length;
        const probability = (successCount / simulations.length) * 100;

        // Calculate the median total investments
        const totalInvestments = simulations.map((simulation) => simulation.cashInvestment);
        totalInvestments.sort((a, b) => a - b);
        const medianInvestment = totalInvestments[Math.floor(totalInvestments.length / 2)];

        // Add the values to the respective rows
        probabilitiesRow.push(probability);
        medianInvestmentsRow.push(medianInvestment);
      } else {
        // If no simulations exist, push null
        probabilitiesRow.push(null);
        medianInvestmentsRow.push(null);
      }
    }

    // Add the rows to the 2D arrays
    probabilities2D.push(probabilitiesRow);
    medianInvestments2D.push(medianInvestmentsRow);
  }

  return { probabilities2D, medianInvestments2D };
}

export const Exploration1D = ({ runSimulations, eventNames, eventTypes, investEvents }) => {
  const [selectedInvestEvent, setSelectedInvestEvent] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [parameter, setParameter] = useState("");
  const [lowerBound, setLowerBound] = useState(0);
  const [upperBound, setUpperBound] = useState(0);
  const [stepSize, setStepSize] = useState(1);
  const [enableRothOptimizer, setEnableRothOptimizer] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null); // State to store simulation results

  const handleRun = () => {
    if (parameter && selectedEvent && lowerBound < upperBound && stepSize > 0) {
      const values = [];
      for (let value = lowerBound; value <= upperBound; value += stepSize) {
        values.push(value);
      }
      runSimulations({ selectedEvent, parameter, values, enableRothOptimizer });
    } else {
      alert("Please provide valid inputs.");
    }
  };

  return (
    <div>
      <h3>1D Scenario Parameter Exploration</h3>

      {/* Dropdown for selecting an event */}
      <label>
        Select Event:
        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">Select Event</option>
          {eventNames.map((eventName, index) => (
            <option key={index} value={eventName}>
              {eventName}
            </option>
          ))}
        </select>
      </label>

      {/* Dropdown for selecting a parameter */}
      <label>
        Select Parameter:
        <select value={parameter} onChange={(e) => setParameter(e.target.value)}>
          <option value="">Select Parameter</option>
          <option value="startYear">Start Year</option>
          <option value="duration">Duration</option>
          <option value="initialAmount">Initial Amount</option>
        </select>
      </label>

      {/* Numeric inputs for bounds and step size */}
      {parameter && (
        <>
          <label>
            Lower Bound:
            <input
              type="number"
              value={lowerBound}
              onChange={(e) => setLowerBound(Number(e.target.value))}
            />
          </label>
          <label>
            Upper Bound:
            <input
              type="number"
              value={upperBound}
              onChange={(e) => setUpperBound(Number(e.target.value))}
            />
          </label>
          <label>
            Step Size:
            <input
              type="number"
              value={stepSize}
              onChange={(e) => setStepSize(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <br />
      
      {/* Dropdown for selecting an investment event */}
      <label>
        Select Asset Allocation for invest event:
        <select value={selectedInvestEvent} onChange={(e) => setSelectedInvestEvent(e.target.value)}>
          <option value="">No Asset Allocation selected</option>
          {investEvents.map((event) => (
            <option key={event.id} value={event.name}>
              {event.name} (
              {Object.entries(event.allocations)
                .map(([assetName, percentage]) => `${assetName}: ${percentage * 100}%`)
                .join(", ")}
              )
            </option>
          ))}
        </select>
      </label>
      <br /> 

      {/* Checkbox for enabling/disabling Roth optimizer */}
      <label>
        Enable Roth Optimizer:
        <input
          type="checkbox"
          checked={enableRothOptimizer}
          onChange={(e) => setEnableRothOptimizer(e.target.checked)}
        />
      </label>
      <br />

      {/* Run Simulations Button */}
      <button onClick={handleRun}>Run Simulations</button>
      
    </div>
  );
};

export const Exploration2D = ({ runSimulations, eventNames, eventTypes, investEvents, scenarioId }) => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedInvestEvent, setSelectedInvestEvent] = useState(""); // State for selected asset allocation
  const [parameter1, setParameter1] = useState(""); // State for the first parameter
  const [parameter2, setParameter2] = useState(""); // State for the second parameter
  const [lowerBound1, setLowerBound1] = useState(0);
  const [upperBound1, setUpperBound1] = useState(0);
  const [stepSize1, setStepSize1] = useState(1);
  const [lowerBound2, setLowerBound2] = useState(0);
  const [upperBound2, setUpperBound2] = useState(0);
  const [stepSize2, setStepSize2] = useState(1);
  const [enableRothOptimizer, setEnableRothOptimizer] = useState(false); // State for Roth optimizer
  const [simulationResults, setSimulationResults] = useState(null); // State to store simulation results
  const [selectedMetric, setSelectedMetric] = useState("probabilities"); // State for selected metric

  const parameterOptions = [
    { value: "startYear", label: "Start Year" },
    { value: "duration", label: "Duration" },
    { value: "initialAmount", label: "Initial Amount" },
  ];

  const handleParameter1Change = (e) => {
    setParameter1(e.target.value);
    // Reset parameter2 if it conflicts with the new parameter1
    if (e.target.value === parameter2) {
      setParameter2("");
    }
  };

  const handleParameter2Change = (e) => {
    setParameter2(e.target.value);
    // Reset parameter1 if it conflicts with the new parameter2
    if (e.target.value === parameter1) {
      setParameter1("");
    }
  };

  const handleRun2DSimulations = async () => {
    if (
      parameter1 &&
      parameter2 &&
      selectedEvent &&
      lowerBound1 < upperBound1 &&
      stepSize1 > 0 &&
      lowerBound2 < upperBound2 &&
      stepSize2 > 0
    ) {
      // Generate values for parameter 1
      const param1Values = [];
      for (let value = lowerBound1; value <= upperBound1; value += stepSize1) {
        param1Values.push(value);
      }

      // Generate values for parameter 2
      const param2Values = [];
      for (let value = lowerBound2; value <= upperBound2; value += stepSize2) {
        param2Values.push(value);
      }

      // Generate all combinations of parameter values
      const combinations = [];
      for (const value1 of param1Values) {
        for (const value2 of param2Values) {
          combinations.push({ param1: value1, param2: value2 });
        }
      }

      console.log("Combinations:", combinations);
      console.log("Selected Event:", selectedEvent);
      console.log("Selected Invest Event:", selectedInvestEvent); // Log selected asset allocation
      console.log("Enable Roth Optimizer:", enableRothOptimizer); // Log Roth optimizer state
      console.log("Parameter 1:", parameter1);
      console.log("Parameter 2:", parameter2);
      console.log("Lower Bound 1:", lowerBound1);
      console.log("Upper Bound 1:", upperBound1);
      console.log("Step Size 1:", stepSize1);
      console.log("Lower Bound 2:", lowerBound2);
      console.log("Upper Bound 2:", upperBound2);
      console.log("Step Size 2:", stepSize2);
      

      try {
        // Send combinations to the backend
        const response = await fetch(`http://localhost:3000/api/run-2d-simulation?id=${scenarioId}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedEvent,
            selectedInvestEvent, // Include selected asset allocation
            parameter1,
            parameter2,
            combinations,
            enableRothOptimizer, // Include Roth optimizer state
          }),
        });

        if (response.ok) {
          const results = await response.json();
          console.log("2D Simulation Results:", results);

          // Store the simulation results and make the plots visible
          setSimulationResults({ results, param1Values, param2Values });
        } else {
          console.error("Failed to run 2D simulations");
        }
      } catch (error) {
        console.error("Error running 2D simulations:", error);
      }
    } else {
      alert("Please provide valid inputs for both parameters.");
    }
  };

  const render2DResults = (simulationResults) => {
    if (!simulationResults) return null;
    console.log("2D Simulation Results:", simulationResults);

    const { probabilities2D, medianInvestments2D } = compile2DResults(simulationResults, simulationResults.financialGoal);

    // Allow the user to select which metric to use as the z-axis
    const zResults = selectedMetric === "probabilities" ? probabilities2D : medianInvestments2D;

    return (
      <div>
        <h3>2D Simulation Results</h3>
        <div className="plot-container">
          <SurfacePlot
            x={simulationResults.param1Values}
            y={simulationResults.param2Values}
            z={zResults}
            title="Surface Plot"
            xLabel="Parameter 1"
            yLabel="Parameter 2"
            zLabel={selectedMetric === "probabilities" ? "Probability of Success (%)" : "Median Investments"}
          />
        </div>
        <div className="plot-container">
          <ContourPlot
            x={simulationResults.param1Values}
            y={simulationResults.param2Values}
            z={zResults}
            title="Contour Plot"
            xLabel="Parameter 1"
            yLabel="Parameter 2"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3>2D Scenario Parameter Exploration</h3>

      {/* Dropdown for selecting an event */}
      <label>
        Select Event:
        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">Select Event</option>
          {eventNames.map((eventName, index) => (
            <option key={index} value={eventName}>
              {eventName}
            </option>
          ))}
        </select>
      </label>

      {/* First Parameter Dropdown */}
      <label>
        Select First Parameter:
        <select value={parameter1} onChange={handleParameter1Change}>
          <option value="">Select Parameter</option>
          {parameterOptions.map(
            (option) =>
              option.value !== parameter2 && ( // Exclude the option selected in parameter2
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
          )}
        </select>
      </label>

      {/* Numeric inputs for first parameter bounds and step size */}
      {parameter1 && (
        <>
          <label>
            Lower Bound:
            <input
              type="number"
              value={lowerBound1}
              onChange={(e) => setLowerBound1(Number(e.target.value))}
            />
          </label>
          <label>
            Upper Bound:
            <input
              type="number"
              value={upperBound1}
              onChange={(e) => setUpperBound1(Number(e.target.value))}
            />
          </label>
          <label>
            Step Size:
            <input
              type="number"
              value={stepSize1}
              onChange={(e) => setStepSize1(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <br />

      {/* Second Parameter Dropdown */}
      <label>
        Select Second Parameter:
        <select value={parameter2} onChange={handleParameter2Change}>
          <option value="">Select Parameter</option>
          {parameterOptions.map(
            (option) =>
              option.value !== parameter1 && ( // Exclude the option selected in parameter1
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              )
          )}
        </select>
      </label>

      {/* Numeric inputs for second parameter bounds and step size */}
      {parameter2 && (
        <>
          <label>
            Lower Bound:
            <input
              type="number"
              value={lowerBound2}
              onChange={(e) => setLowerBound2(Number(e.target.value))}
            />
          </label>
          <label>
            Upper Bound:
            <input
              type="number"
              value={upperBound2}
              onChange={(e) => setUpperBound2(Number(e.target.value))}
            />
          </label>
          <label>
            Step Size:
            <input
              type="number"
              value={stepSize2}
              onChange={(e) => setStepSize2(Number(e.target.value))}
            />
          </label>
        </>
      )}
      <br />
      {/* Dropdown for selecting an investment event */}
      <label>
        Select Asset Allocation for invest event:
        <select value={selectedInvestEvent} onChange={(e) => setSelectedInvestEvent(e.target.value)}>
          <option value="">No Asset Allocation selected</option>
          {investEvents.map((event) => (
            <option key={event.id} value={event.name}>
              {event.name} (
              {Object.entries(event.allocations)
                .map(([assetName, percentage]) => `${assetName}: ${percentage * 100}%`)
                .join(", ")}
              )
            </option>
          ))}
        </select>
      </label>
      <br />

      {/* Checkbox for enabling/disabling Roth optimizer */}
      <label>
        Enable Roth Optimizer:
        <input
          type="checkbox"
          checked={enableRothOptimizer}
          onChange={(e) => setEnableRothOptimizer(e.target.checked)}
        />
      </label>
      <br />

      {/* Dropdown for selecting metric */}
      <label>
        Select Metric:
        <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
          <option value="probabilities">Probability of Success</option>
          <option value="medianInvestments">Median Investments</option>
        </select>
      </label>
      <br />

      {/* Run Simulations Button */}
      <button onClick={handleRun2DSimulations}>Run Simulations</button>

      {/* Render 2D Results */}
      {render2DResults(simulationResults)}
    </div>
  );
};