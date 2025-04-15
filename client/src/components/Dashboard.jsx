import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
/* import display scenarios? how to display the different scenario tabs */
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";
import { useNavigate } from "react-router-dom";
import { handleScenarioUpload } from "../utils";
import yaml from "js-yaml";

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
  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (file && (file.name.split('.').pop().toLowerCase() == "yml" || file.name.split('.').pop().toLowerCase() == "yaml")) { // Parse and validate data into scenario object and send to server
      try {
        // RETRIEVE ALL RELEVANT SCENARIO INFORMATION
        const fileContent = await file.text();
        const yamlScn = yaml.load(fileContent);
        console.log(yamlScn);

        // SCENARIO FOR UPLOAD
        const scenario = {
          name: yamlScn.name,
          maritalStatus: yamlScn.maritalStatus,
          birthYears: yamlScn.birthYears,
          lifeExpectancy: yamlScn.lifeExpectancy,
          inflationAssumption: yamlScn.inflationAssumption,
          afterTaxContributionLimit: yamlScn.afterTaxContributionLimit,
          financialGoal: yamlScn.financialGoal,
          residenceState: yamlScn.residenceState,
        }

        // INVESTMENTS FOR UPLOAD
        const investments = [];
        yamlScn.investments.forEach(elem => {
          investments.push({
            investmentType: elem.investmentType,
            value: elem.value,
            taxStatus: elem.taxStatus,
          });
        });

        // STRATEGIES FOR UPLOAD
        const strategies = {
          spend: yamlScn.spendingStrategy, // Discretionary Expenses
          expense: yamlScn.expenseWithdrawalStrategy, // Investments
          rmd: yamlScn.RMDStrategy,
          roth: {
            opt: yamlScn.RothConversionOpt,
            start: yamlScn.RothConversionStart,
            end: yamlScn.RothConversionEnd,
            strategy: yamlScn.RothConversionStrategy,
          }
        }

        // JSON FOR SERVER UPLOAD
        const completeScenario = {
          scenario: scenario,
          investmentTypes: yamlScn.investmentTypes,
          investments: investments,
          eventSeries: yamlScn.eventSeries,
          strategies: strategies,
        }

        // UPLOAD SCENARIO
        fetch("http://localhost:3000/api/import-scenario", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(completeScenario)
        })
        .then(res => res.json())
        .then(data => {
          window.location.href = `/scenario/${data.scenario_id}`;
        })
        .catch((error) => console.error("Error:", error));


      }
      catch {
        console.log("Error parsing scenario object");
      }
      
    }
    else {

    }
  }

  return (
    <>
      <div className={`popup-upload ${isActive ? "active" : ""}`}>
        <div>
          <h3>Submit a YAML file.</h3>
          <input onChange={uploadFile} type="file" accept=".yaml,.yml" />
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
  const navigate = useNavigate();

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

  const handleScenarioClick = (scenarioId) => {
    // Redirect to the scenario page with the selected scenario ID
    navigate(`/scenario/${scenarioId}`);
  };

  return (
    <div className="content-dashboard fade-in">
      <div className="scenarios-list">
        {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => {
            const renderFields = (fields) =>
              fields
                .filter(({ value }) => value != null)
                .map(({ label, value }) => `${label}: ${value}`)
                .join(", ");

            return (
              <div key={index} className="scenario-item">
                <h3>
                  <strong>Scenario Name: </strong>
                  {scenario.name}
                </h3>
                <button onClick={() => handleScenarioClick(scenario.id)}>
                  View
                </button>
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
