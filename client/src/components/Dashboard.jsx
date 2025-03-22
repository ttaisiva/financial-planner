import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
/* import display scenarios? how to display the different scenario tabs */
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";

export const Dashboard = () => {
  useEffect(() => {
    loadAnimation();
  });

  return (
    <div className="content-main fade-in-up">
      <h1>Welcome to your dashboard, username!</h1>

      <div className="header-local fade-in-up">
        <h2>My Scenarios</h2>
        <Link to="/NewScenarioPage" className="button-primary">
          Create New Scenario
        </Link>
      </div>
      <section className="scenarios fade-in-up">
        <div className="filter_options">
          <label>
            <input type="checkbox" checked /> Created by me
          </label>
          <label>
            <input type="checkbox" /> Shared with me
          </label>
        </div>

        <div className="user_scenarios">
          <DisplayUserScenarios />
        </div>
      </section>
    </div>
  );
};




export const DisplayUserScenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  
  
  const fetchScenarios = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      } else {
        console.error('Failed to fetch scenarios');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    loadAnimation();
    fetchScenarios();
  }, []);



  return (
    <div className="content-main fade-in-up">
      <div className="scenarios-list">
        {scenarios.length > 0 ? (
          
          scenarios.map((scenario, index) => (
            <div key={index} className="scenario-item">
              <h3>{scenario.scenario_name}</h3>
              <p>{scenario.financial_goal}</p>
              <p>{scenario.filling_status}</p>
              <p>{scenario.state_of_residence}</p>
              {/* Add more fields as needed */}
            </div>
          ))
        ) : (
          <p>No scenarios available</p>
        )}
      </div>
    </div>
  );
};

