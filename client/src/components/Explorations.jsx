import React, { useState } from "react";

export const Exploration1D = ({
  runSimulations,
  eventNames,
  eventTypes,
  investEvents,
  scenarioId,
}) => {
  const [selectedInvestEvent, setSelectedInvestEvent] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [parameter, setParameter] = useState("");
  const [lowerBound, setLowerBound] = useState(0);
  const [upperBound, setUpperBound] = useState(0);
  const [stepSize, setStepSize] = useState(1);
  const [enableRothOptimizer, setEnableRothOptimizer] = useState(false);

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

  const handleRun1DSimulations = async () => {
    console.log("Running 1D simulations...");
    if (parameter && selectedEvent && lowerBound < upperBound && stepSize > 0) {
      // Generate values for the parameter
      const paramValues = [];
      for (let value = lowerBound; value <= upperBound; value += stepSize) {
        paramValues.push(value);
      }

      try {
        // Send parameter values to the backend
        const response = await fetch(
          `http://localhost:3000/api/run-1d-simulation?id=${scenarioId}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              selectedEvent,
              parameter,
              values: paramValues,
              enableRothOptimizer,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to run 1D simulations");
        }

        const result = await response.json();
        console.log("1D Simulation Results:", result);

        // Handle the result (e.g., update chart data)
        // setChartData(result);
      } catch (error) {
        console.error("Error running 1D simulations:", error);
      }
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
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
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
        <select
          value={parameter}
          onChange={(e) => setParameter(e.target.value)}
        >
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
        <select
          value={selectedInvestEvent}
          onChange={(e) => setSelectedInvestEvent(e.target.value)}
        >
          <option value="">No Asset Allocation selected</option>
          {investEvents.map((event) => (
            <option key={event.id} value={event.name}>
              {event.name} (
              {Object.entries(event.allocations)
                .map(
                  ([assetName, percentage]) =>
                    `${assetName}: ${percentage * 100}%`
                )
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
      <button onClick={handleRun1DSimulations}>Run Simulations</button>
    </div>
  );
};

export const Exploration2D = ({
  runSimulations,
  eventNames,
  eventTypes,
  investEvents,
  scenarioId,
}) => {
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

      try {
        // Send combinations to the backend
        const response = await fetch(
          `http://localhost:3000/api/run-2d-simulation?id=${scenarioId}`,
          {
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
          }
        );

        if (response.ok) {
          const results = await response.json();
          console.log("2D Simulation Results:", results);
          // Handle results (e.g., pass them to a visualization component)
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

  return (
    <div>
      <h3>2D Scenario Parameter Exploration</h3>

      {/* Dropdown for selecting an event */}
      <label>
        Select Event:
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
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
        <select
          value={selectedInvestEvent}
          onChange={(e) => setSelectedInvestEvent(e.target.value)}
        >
          <option value="">No Asset Allocation selected</option>
          {investEvents.map((event) => (
            <option key={event.id} value={event.name}>
              {event.name} (
              {Object.entries(event.allocations)
                .map(
                  ([assetName, percentage]) =>
                    `${assetName}: ${percentage * 100}%`
                )
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
      <button onClick={handleRun2DSimulations}>Run Simulations</button>
    </div>
  );
};
