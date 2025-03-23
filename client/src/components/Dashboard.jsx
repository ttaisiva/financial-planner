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
    <div className="container-dashboard">
      <div className="content-dashboard">
        <h1 className="dashboard fade-in-up">
          Welcome to your dashboard, username!
        </h1>

        <div className="header-dashboard fade-in-up">
          <h6 className="dashboard">My Scenarios</h6>
          <Link to="/NewScenarioPage" className="create-scenario">
            <img src="client\public\plus.png" className="icon"></img>
            <img
              src="client\public\plus_white.png"
              className="icon-hover"
            ></img>
            Create New Scenario
          </Link>
        </div>

        <div className="filter-options fade-in-up">
          <label>
            <input type="checkbox" checked /> Created by me
          </label>
          <label>
            <input type="checkbox" /> Shared with me
          </label>
        </div>

        <section className="scenarios fade-in-up">
          <div className="user_scenarios">
            <p> show scenarios here...</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
