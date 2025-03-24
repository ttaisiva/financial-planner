import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
/* import display scenarios? how to display the different scenario tabs */
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";
import { handleScenarioUpload } from "../utils";

export const Dashboard = () => {
  const [username, setUsername] = useState("undefined");


  useEffect(() => {
    loadAnimation();
      
    fetch("http://localhost:3000/auth/isAuth", {
      method: "GET",
      credentials: "include",
    })
    .then((res) => res.json())
    .then((data) => {
      setUsername(data.name);
    });
  });

  return (
    <div className="container-dashboard">
      <div className="content-dashboard">
        <DashboardContent />
        <div className="user_scenarios">
          <DisplayUserScenarios />
        </div>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const toggleUpload = () => {
    setShowUpload(!showUpload);
  };

  return (
    <>
      {/* Add Scenario Popups */}
      <Popup
        togglePopup={togglePopup}
        isActive={showPopup}
        toggleUpload={toggleUpload}
      />
      <div className={`overlay ${showPopup ? "active" : ""}`}></div>

      {/* Submit Scenario YAML Popup */}
      <UploadScenario
        toggleUpload={toggleUpload}
        isActive={showUpload}
        // handleFileChange={handleFileChange}
      />
      <div className={`upload-overlay ${showUpload ? "active" : ""}`}></div>

      {/* Main Content */}
      <h1 className="dashboard fade-in">Welcome to your dashboard!</h1>

      <div className="header-dashboard fade-in">
        <h6 className="dashboard">My Scenarios</h6>

        <button onClick={togglePopup} className="create-scenario">
          <img src="client\public\plus.png" className="icon"></img>
          <img src="client\public\plus_white.png" className="icon-hover"></img>
          Add New Scenario
        </button>
      </div>

      <div className="filter-options fade-in">
        <label>
          <input type="checkbox" checked /> Created by me
        </label>
        <label>
          <input type="checkbox" /> Shared with me
        </label>
      </div>
    </>
  );
};

/**
 * Popup after pressing "Add a Scenario". Prompts the user to choose between uploading a YAML file of a Scenario or creating a new Scenario
 *
 * @param {*} param0
 * @returns React JS element
 * TP: GitHub Copilot GPT-4o, prompt - "how to make a pop up element after pressing a button on my website.
 * i am making a react app. this pop up element has buttons on it too"
 */
const Popup = ({ togglePopup, isActive, toggleUpload }) => {
  return (
    <div className={`popup ${isActive ? "active" : ""}`}>
      <div className="content-popup">
        <h1>How would you like to add a scenario?</h1>

        <div>
          <button onClick={toggleUpload} className="button-popup">
            <h3>Upload an existing Scenario</h3>
            <p>
              Scenarios can be exported and imported as YAML files. Import an
              existing Scenario YAML file.
            </p>
          </button>
          <Link to="/create/scenario">
            <div className="button-popup">
              <h3>Create a Scenario from scratch</h3>
              <p>
                Start with a blank canvas and create a new scenario completely
                from scratch!
              </p>
            </div>
          </Link>
        </div>

        <div>
          <button onClick={togglePopup} className="btn-action-popup">
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadScenario = ({ toggleUpload, isActive }) => {
  return (
    <>
      <div className={`popup-upload ${isActive ? "active" : ""}`}>
        <div>
          <h3>Submit a YAML file.</h3>
          <input type="file" accept=".yaml,.yml" />
        </div>
        <div>
          <button onClick={toggleUpload} className="btn-action-popup">
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export const DisplayUserScenarios = () => {
  const [scenarios, setScenarios] = useState([]);

  const fetchScenarios = async () => {
    try {
      setScenarios([]); // Reset existing data before fetching new
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

  return (

    <div className="content-dashboard fade-in">
      <div className="scenarios-list">
      {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => {
            const renderFields = (fields) =>
              fields
                .filter(({ value }) => value != null)
                .map(({ label, value }) => `${label}: ${value}`)
                .join(', ');

    
          return (
            <div key={index} className="scenario-item">
            <h3><strong>Scenario Name: </strong>{scenario.scenario_name}</h3>
                
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
