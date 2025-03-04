import React from "react";
import ScenarioCard from "./ScenarioCard";
import "../styles/Dashboard.css";


const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Welcome, username!</h2>

      <section className="scenarios">
        <h3>My Scenarios</h3>
        <div className="filter_options">
          <label><input type="checkbox" checked /> Created by me</label>
          <label><input type="checkbox" /> Shared with me</label>
        </div>
        
        <div className="user_scenarios">
          <p> show scenarios here...</p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;