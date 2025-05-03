import React, { useState } from "react";

export const Exploration1D = ({ runSimulations, eventNames }) => {
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

      {/* Checkbox for enabling/disabling Roth optimizer */}
      <label>
        Enable Roth Optimizer:
        <input
          type="checkbox"
          checked={enableRothOptimizer}
          onChange={(e) => setEnableRothOptimizer(e.target.checked)}
        />
      </label>

      {/* Run Simulations Button */}
      <button onClick={handleRun}>Run Simulations</button>
    </div>
  );
};