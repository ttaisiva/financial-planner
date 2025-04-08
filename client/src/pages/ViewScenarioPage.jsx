import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {useState, useEffect} from "react";
import { loadAnimation } from "../utils";

//this is for simulation results
export const ViewScenarioPage = () => {
  const [numSimulations, setNumSimulations] = useState(1000); // Default value for simulations
  const [simulationResults, setSimulationResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const response = await fetch("http://localhost:3000/run-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numSimulations }), // Send the number of simulations to the backend
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationResults(data); // Store the simulation results
      } else {
        console.error("Failed to run simulation");
      }
    } catch (error) {
      console.error("Error running simulation:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="viewscenario-container">
      <Header />
      <h1> Your Scenario </h1>
      {/* <ViewUserScenarios /> */} maybe only display the current scenario..need to edit this...

      <div className="simulation-controls">
        <h3>Simulation</h3>
        <label>Number of Simulations:</label>
        <input
          type="number"
          id="numSimulations"
          value={numSimulations}
          onChange={(e) => setNumSimulations(Number(e.target.value))}
          min="1"
          disabled={isRunning}
        />
        <button onClick={handleRunSimulation} disabled={isRunning}>
          {isRunning ? "Running..." : "Run Simulation"}
        </button>
      </div>

      
      <DisplaySimulationResults />
      <Footer />
    </div>
  );
};

export default ViewScenarioPage;

export const ViewSingleScenario = () => {
  //placeholder need to implmement this

};


export const DisplaySimulationResults = () => {
  //placeholder need to implmement this
  return <div>Simulation Results</div>;
};

export const ViewUserScenarios = () => {
  const [scenarios, setScenarios] = useState([]);

  const fetchScenarios = async () => {
    try {
      setScenarios([]);
      const response = await fetch("http://localhost:3000/api/scenarios", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      } else {
        console.error("Failed to fetch scenarios");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    loadAnimation();
    fetchScenarios();
  }, []);

  // Utility to render list of key-value fields from an object
  const renderFieldsList = (items) =>
    items.map((obj, i) => (
      <div key={i} className="fields-group">
        {Object.entries(obj)
          .filter(([_, value]) => value != null)
          .map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {value.toString()}</p>
          ))}
        <hr />
      </div>
    ));

  return (
    <div className="content-dashboard fade-in">
      <div className="scenarios-list">
        {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => {
            const userFields = [
              { label: "Life Expectancy Type", value: scenario.user_life_expectancy_type },
              { label: "Life Expectancy Value", value: scenario.user_life_expectancy_value },
              { label: "Life Expectancy Mean", value: scenario.user_life_expectancy_mean },
              { label: "Life Expectancy Std Dev", value: scenario.user_life_expectancy_std_dev },
              { label: "Retirement Age", value: scenario.user_retirement_age_type },
              { label: "Retirement Age Value", value: scenario.user_retirement_age_value },
              { label: "Retirement Age Mean", value: scenario.user_retirement_age_mean },
              { label: "Retirement Age Std Dev", value: scenario.user_retirement_age_std_dev },
            ];

            const spouseFields = [
              { label: "Life Expectancy Type", value: scenario.spouse_life_expectancy_type },
              { label: "Life Expectancy Value", value: scenario.spouse_life_expectancy_value },
              { label: "Life Expectancy Mean", value: scenario.spouse_life_expectancy_mean },
              { label: "Life Expectancy Std Dev", value: scenario.spouse_life_expectancy_std_dev },
              { label: "Retirement Age", value: scenario.spouse_retirement_age_type },
              { label: "Retirement Age Value", value: scenario.spouse_retirement_age_value },
              { label: "Retirement Age Mean", value: scenario.spouse_retirement_age_mean },
              { label: "Retirement Age Std Dev", value: scenario.spouse_retirement_age_std_dev },
            ];

            const hasSpouseData = spouseFields.some(({ value }) => value != null);

            return (
              <div key={index} className="scenario-item">
                <h3>{scenario.scenario_name}</h3>
                <h4>User Info</h4>
                <p>{scenario.financial_goal}, {scenario.filing_status}, {scenario.state_of_residence}</p>
                <p>
                  {userFields
                    .filter(({ value }) => value != null)
                    .map(({ label, value }) => `${label}: ${value}`)
                    .join(", ")}
                </p>

                {hasSpouseData && (
                  <>
                    <h4>Spouse Info</h4>
                    <p>
                      {spouseFields
                        .filter(({ value }) => value != null)
                        .map(({ label, value }) => `${label}: ${value}`)
                        .join(", ")}
                    </p>
                  </>
                )}

                {scenario.investment_types?.length > 0 && (
                  <>
                    <h4>Investment Types</h4>
                    {renderFieldsList(scenario.investment_types)}
                  </>
                )}

                {scenario.investments?.length > 0 && (
                  <>
                    <h4>Investments</h4>
                    {renderFieldsList(scenario.investments)}
                  </>
                )}

                {scenario.events?.length > 0 && (
                  <>
                    <h4>Events</h4>
                    {renderFieldsList(scenario.events)}
                  </>
                )}

                {scenario.strategies?.length > 0 && (
                  <>
                    <h4>Strategies</h4>
                    {renderFieldsList(scenario.strategies)}
                  </>
                )}
                
              </div>
            );
          })
        ) : (
          <p className="fade-in">No scenarios available</p>
        )}
      </div>
    </div>
  );
};