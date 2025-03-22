import React, { useEffect } from "react";
import "../styles/Dashboard.css";
/* import display scenarios? how to display the different scenario tabs */
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";

const Dashboard = () => {
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
          <p> show scenarios here...</p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
