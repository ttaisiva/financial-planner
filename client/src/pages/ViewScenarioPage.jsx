import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { loadAnimation, fetchEventNames , fetchEventTypes, fetchInvest1d} from "../utils";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import yaml, { load } from "js-yaml";
import { LineChart, ShadedLineChart, StackedBarChart, calculateSuccessProbability } from "../utilsPlots";
import { Exploration1D, Exploration2D } from "../components/Explorations";

//this is for simulation results
export const ViewScenarioPage = () => {
  const [numSimulations, setNumSimulations] = useState(""); // Default value for simulations
  const [investEvents, setInvestEvents] = useState([]); // State to store invest events
  const [simulationResults, setSimulationResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userId, setUserId] = useState(null); // State to store user ID
  const [scenarioId, setScenarioId] = useState(null); // State to store scenario ID
  const [eventNames, setEventNames] = useState([]);
  const [eventTypes, setEventTypes] = useState([]); // State to store event types
  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const { id: scenarioIdFromUrl } = useParams(); // gets scenario id from url that took you to this page
  useEffect(() => {
    if (scenarioIdFromUrl) {
      setScenarioId(scenarioIdFromUrl);
    }
  }, [scenarioIdFromUrl]);

  useEffect(() => {
    const loadEventNames = async () => {
      if (scenarioId) {
        const names = await fetchEventNames(scenarioId);
        setEventNames(names);
      }
    };

    loadEventNames();
  }, [scenarioId]);

  useEffect(() => {
    const loadEventTypes = async () => {
      if (scenarioId) { 
        const types = await fetchEventTypes(scenarioId); 
        setEventTypes(types);
      }
    };

    loadEventTypes();
  }, [scenarioId]);

  useEffect(() => {
    const loadInvestEvents = async () => {
      if (scenarioId) {
        const events = await fetchInvest1d(scenarioId);
        setInvestEvents(events);
      }
    };

    loadInvestEvents();
  }, [scenarioId]);

  console.log("Invest Events:", investEvents); // Log invest events

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      //const MYuserId = '107981191838034384868';
      const response = await fetch("http://localhost:3000/api/run-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numSimulations, userId, scenarioId }), // Send the number of simulations to the backend
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
      console.log("Simulation completed");
      setIsRunning(false);
    }
  };

  const exportScenario = async () => {
    fetch(`http://localhost:3000/api/export-scenario?id=${scenarioId}`, {
      method: "GET",
      credentials: "include",
    })
    .then(res => res.json())
    .then(data => {
      /*
        CHATGPT: send the javascript object to the client and have the client turn it into a yaml file for download
      */
      const yamlContent = yaml.dump(data);

      // Create a Blob from the YAML content
      const blob = new Blob([yamlContent], { type: 'text/yaml' });

      // Create an anchor element to trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scenario.yaml'; // Name of the downloaded file
      a.click();

      window.URL.revokeObjectURL(url);
    })
    .catch((error) => console.error("Error:", error));
  }

  /**
   * CHATGPT
   * Prompt: give me an html snippet for a short form that takes each line as an email for sharing purposes; additional prompts to tailor for react with adding and removing emails
   * TODO: Make it so when opening a scenario, previously shared users get added to share popup
   */
  function ShareForm() {
    const [sharedUsers, setSharedUsers] = useState([
      { email: '', access: 'read' },
    ]);
  
    const handleEmailChange = (index, event) => {
      const updatedUsers = [...sharedUsers];
      updatedUsers[index].email = event.target.value;
      setSharedUsers(updatedUsers);
    };
  
    const handleAccessChange = (index, event) => {
      const updatedUsers = [...sharedUsers];
      updatedUsers[index].access = event.target.value;
      setSharedUsers(updatedUsers);
    };
  
    const handleAddUser = () => {
      setSharedUsers([...sharedUsers, { email: '', access: 'read' }]);
    };
  
    const handleRemoveUser = (index) => {
      const updatedUsers = sharedUsers.filter((_, i) => i !== index);
      setSharedUsers(updatedUsers);
    };
  
    const handleSubmit = (event) => {
      event.preventDefault();
      const cleanedUsers = sharedUsers
        .map(u => ({ email: u.email.trim(), access: u.access }))
        .filter(u => u.email !== '');
      console.log('Users to share with:', cleanedUsers);

      fetch(`http://localhost:3000/api/share-scenario?id=${scenarioId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: cleanedUsers }) // Should just be an array of Strings (emails)
      })
      .catch(error => console.error('Error:', error));

      // Toggle Share
      togglePopup();
    };
  
    return (
      <form onSubmit={handleSubmit}>
        {sharedUsers.map((user, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="email"
              value={user.email}
              onChange={(e) => handleEmailChange(index, e)}
              placeholder="Enter email address"
              required
            />
            <select
              value={user.access}
              onChange={(e) => handleAccessChange(index, e)}
              style={{ marginLeft: '8px' }}
            >
              <option value="read">Read Access</option>
              <option value="write">Write Access</option>
            </select>
            {sharedUsers.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUser(index)}
                style={{ marginLeft: '8px' }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddUser}>
          Add another user
        </button>
        <br /><br />
        <button type="submit">Share</button>
      </form>
    );
  }

  const Popup = ({ togglePopup, isActive }) => {
    return (
      <div className={`popup ${isActive ? "active" : ""}`}>
        <div className="content-popup">
          <h2>Add Users to Share Scenario</h2>
          <ShareForm />
          <div>
            <button onClick={togglePopup} className="btn-action-popup">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="viewscenario-container">
      <Header />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ marginRight: "10px" }}> Your Scenario </h1>
        {/* Add Scenario Popups */}
        <Popup
          togglePopup={togglePopup}
          isActive={showPopup}
        />
        <button onClick={togglePopup} className="share-popup">
          {/*<img src="client\public\plus.png" className="icon"></img>
          <img src="client\public\plus_white.png" className="icon-hover"></img>*/}
          Share
        </button>
        <div className={`overlay ${showPopup ? "active" : ""}`}></div>
      </div>
      <ViewSingleScenario
        scenarioId={scenarioId}
        setScenarioId={setScenarioId}
        userId={userId}
        setUserId={setUserId}
      />

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

      {simulationResults && <DisplaySimulationResults simulationResults={simulationResults} /> }
      {simulationResults && <h2> Scenario Parameter Exploration</h2>}
      {simulationResults && <Exploration1D eventNames={eventNames} eventTypes={eventTypes} investEvents={investEvents}/>}
      {simulationResults && <Exploration2D eventNames={eventNames} eventTypes={eventTypes} investEvents={investEvents} scenarioId={scenarioId}/>}
      <button onClick={exportScenario}>Export Scenario</button>
      <Footer />
    </div>
  );
};

export default ViewScenarioPage;

export const ViewSingleScenario = ({
  scenarioId,
  setScenarioId,
  userId,
  setUserId,
}) => {
  //placeholder need to implmement this
  const [scenario, setScenario] = useState([]);
  const location = useLocation();
  const tempScenarioId = location.state?.scenario_id; // Access the scenario_id from the state
  // setScenarioId(tempScenarioId);

  // console.log("Temp Scenario ID:", scenarioId);

  const fetchScenario = async () => {
    try {
      setScenario([]);
      const response = await fetch(
        `http://localhost:3000/api/single-scenario?scenarioId=${scenarioId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Scenario data:", data);
        setScenario(data);

        if (data.user_id) {
          setUserId(data.user_id);
          console.log("User ID from scenario:", data.user_id);
        }
      } else {
        console.error("Failed to fetch scenario");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (scenarioId) {
      fetchScenario();
      console.log("Scenario:", scenario);
      //pass scenarioId and const userId= scenario.user_id to  view scenario page component
    } else {
      console.error("No scenario ID provided");
    }
  }, [scenarioId]);

  const formatDistribution = (dist) => {
    if (!dist) return "N/A";
  
    const { type, mean, stdev, value, lower, upper, eventSeries } = dist;
  
    switch (type) {
      case "fixed":
        return `Fixed Value: ${value}`;
      case "normal":
        return `Normal (Mean: ${mean}, Std Dev: ${stdev})`;
      case "uniform":
        return `Uniform (Lower: ${lower}, Upper: ${upper})`;
      case "startWith":
        return `Start With ${eventSeries}`;
      case "startAfter":
        return `Start After ${eventSeries}`;
      default:
        return "Unknown Distribution Type";
    }
  };

  const formatAssetAllocation = (allocation) => {
    if (!allocation || typeof allocation !== "object") return "N/A";
  
    return Object.entries(allocation)
      .map(([key, value]) => `${key}: ${(value * 100).toFixed(2)}%`)
      .join(", ");
  };

  // Utility to render list of key-value fields from an object
  const renderAttributes = (obj) => {
    return (
      <div className="attributes-list">
        {Object.entries(obj)
          .filter(([_, value]) => value != null) // Filter out null or undefined values
          .map(([key, value]) => (
            <p key={key}>
              <strong>
                {
                  key
                    .replace(/_/g, " ") // Replace underscores with spaces
                    .replace(/user /i, "") // Remove "user" (case-insensitive)
                    .replace(/spouse /i, "") // Remove "spouse" (case-insensitive)
                }
                :
              </strong>{" "}
              {(key.includes("distribution") ||
              ["start", "duration"].includes(key.toLowerCase())) &&
            typeof value === "object"
              ? formatDistribution(value) // Apply formatDistribution for specific keys
              : ["asset_allocation", "asset_allocation2"].includes(key.toLowerCase()) &&
                typeof value === "object"
              ? formatAssetAllocation(value) // Apply formatAssetAllocation for asset allocation keys
              : value.toString()}
            </p>
          ))}
      </div>
    );
  };

  return (
    <div className="content-dashboard fade-in">
      <div>
        <div className="row">
          <div className="item">
            <h3>Scenario Details</h3>
            {scenario && scenario.scenarioDetails &&
              renderAttributes({
                scenario_name: scenario.scenarioDetails[0].name,
                filing_status: scenario.scenarioDetails[0].marital_status,
                state_of_residence: scenario.scenarioDetails[0].residence_state,
              })
              }
          </div>

          <div className="item">
            <h3>Financial Details</h3>
            {scenario && scenario.scenarioDetails &&
              renderAttributes({
                financial_goal: scenario.scenarioDetails[0].financial_goal,
                inflation_assumption: formatDistribution(scenario.scenarioDetails[0].inflation_assumption)
              })}
          </div>

          <div className="item">
            <h3>Personal Details</h3>
            {scenario && scenario.scenarioDetails &&
              renderAttributes({
                user_birth_year: scenario.scenarioDetails[0].birth_years[0],
                life_expectancy: formatDistribution(scenario.scenarioDetails[0].life_expectancy[0]),
              })}
          </div>

          {scenario  && scenario.scenarioDetails?.[0]?.birth_years?.length > 1  && (
            <div className="item">
              <h3>Spouse Details</h3>
              {scenario &&
                renderAttributes({
                  spouse_birth_year: scenario.scenarioDetails[0].birth_years[1],
                  spouse_life_expectancy: formatDistribution(scenario.scenarioDetails[0].life_expectancy[1]),
                })}
            </div>
          )}
        </div>
      </div>

      <div></div>

      {/* Render related data if available */}
      <div>
        {scenario.investments?.length > 0 && (
          <>
            <h3 style={{ textAlign: "center" }}>Investments</h3>
            <div className="grid">
              {scenario.investments.map((investment, index) => (
                <div key={index} className="item">
                  {renderAttributes(investment)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>


      <div>
        {scenario.investment_types?.length > 0 && (
          <>
            <h3>Investment Types</h3>
            <div className="grid">
              {scenario.investment_types.map((type, index) => (
                <div key={index} className="item">
                  {renderAttributes(type)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        {scenario.events?.length > 0 && (
          <>
            <h3 style={{ textAlign: "center" }}>Events</h3>
            <div className="grid">
              {scenario.events.map((event, index) => (
                <div key={index} className="item">
                  {renderAttributes(event)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        {scenario.strategy?.length > 0 && (
          <>
            <h3 style={{ textAlign: "center" }}>Strategies</h3>
            <div className="grid">
              {scenario.strategy.map((strategy, index) => (
                <div key={index} className="item">
                  {renderAttributes(strategy)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const DisplaySimulationResults = ({ simulationResults }) => {
  console.log("Simulation Results:", simulationResults); // Log the simulation results

  if (!simulationResults || simulationResults.length === 0) {
    return <p>No simulation results available.</p>;
  }

  const [selectedOption, setSelectedOption] = useState("cashInvestment");
  const [breakdownType, setBreakdownType] = useState("investments"); // Default to "investments"
  const [aggregationThreshold, setAggregationThreshold] = useState(0); // Default threshold
  const [useMedian, setUseMedian] = useState(true); // Default to median


  const { median, mean, min, max, financialGoal, totalSimulations, allSimulationResults } = simulationResults;
  console.log("Now allSimulationResults:", allSimulationResults); // Log all simulation results
  const successProbabilities = calculateSuccessProbability(allSimulationResults.flat(1), Number(financialGoal));
  console.log("Success Probabilities:", successProbabilities); 


  return (
    <div>
      <h2>Simulation Results</h2>
      <div className="summary">
        <p><strong>Total Simulations:</strong> {totalSimulations}</p>
        <p><strong>Median:</strong> ${median.toFixed(2)}</p>
        <p><strong>Mean:</strong> ${mean.toFixed(2)}</p>
        <p><strong>Min:</strong> ${min.toFixed(2)}</p>
        <p><strong>Max:</strong> ${max.toFixed(2)}</p>
        <p><strong>Financial Goal: </strong> ${Number(financialGoal).toFixed(2)}</p>
      </div>

      <div className="simulation-details">
        {allSimulationResults.flat(1).map((simulation, simIndex) => (
          <div key={simIndex} className="simulation" >
            <h3>Simulation {simIndex + 1}</h3>
            <div className="simulation-row">
            {simulation.map((yearlyResult, yearIndex) => (
              <div key={yearIndex} className="simulationitem">
                <h4>Year: {yearlyResult.year}</h4>
                <p><strong>Cash Investment:</strong> ${Number(yearlyResult.cashInvestment).toFixed(2)}</p>
                <p><strong>Current Year Income:</strong> ${Number(yearlyResult.curYearIncome).toFixed(2)}</p>
                <p><strong>Current Year Social Security:</strong> ${Number(yearlyResult.curYearSS).toFixed(2)}</p>
                <p><strong>Current Year Gains:</strong> ${Number(yearlyResult.curYearGains).toFixed(2)}</p>
                <p><strong>Current Year Early Withdrawals:</strong> ${Number(yearlyResult.curYearEarlyWithdrawals).toFixed(2)}</p>
              </div>
            ))}
            </div>
          </div>
        ))}
      </div>

      {/* Charts 4.1*/}
      
      <div className="line-chart-container">
        <h3>Success Probability Over Time</h3>
        <LineChart successProbabilities={successProbabilities} />
      </div>
      
      {/* Charts 4.2*/}
      <div className="shaded-line-chart-container"> 
        <h3>Shaded Success Probability Over Time</h3>
        <p> Select a quantity to view as a shaded line chart</p>

        <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} >
          <option value="cashInvestment">Cash Investment</option>
          <option value="curYearIncome">Current Year Income</option>
          <option value="curYearEarlyWithdrawals">Current Year Early Withdrawals</option>
          <option value="expenses">Expenses (including tax)</option>
          <option value="discExpenses">% of Total Discretionary Expenses</option>
        </select>

        <ShadedLineChart
           label={selectedOption}
           allSimulationResults={allSimulationResults.flat(1)}
           financialGoal={selectedOption === "cashInvestments" ? financialGoal : null}
         />
      </div>  

      {/* Charts 4.3*/}
      <div>
          <h3>Stacked Bar Chart</h3>
          <select value={breakdownType} onChange={(e) => setBreakdownType(e.target.value)} >
            <option value="investments">Investments</option>
            <option value="income">Income</option>
            <option value="expenses">Expenses</option>
          </select>

          <label>Aggregation Threshold:</label>
          <input
              type="number"
              id="aggregationThreshold"
              value={aggregationThreshold}
              onChange={(e) => setAggregationThreshold(Number(e.target.value))}
              min="0"
            />
          <label htmlFor="useMedian">Use Median:</label>
          <input
              type="checkbox"
              id="useMedian"
              checked={useMedian}
              onChange={(e) => setUseMedian(e.target.checked)}
          />
          <StackedBarChart
            allSimulationResults={allSimulationResults.flat(1)}
            breakdownType= {breakdownType} // "investments", "income", or "expenses"
            aggregationThreshold={aggregationThreshold} // Threshold for aggregation
            useMedian={useMedian} // true for median, false for average
          />

      </div>
     

    
    </div>
  );
};
