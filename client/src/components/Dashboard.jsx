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

    // <div className="content-dashboard fade-in">
    //   <div className="scenarios-list">
    //     {scenarios.length > 0 ? (
    //       scenarios.map((scenario, index) => {
    //         const renderField = (label, value) =>
    //           value != null ? <p>{label}: {value}</p> : null;

    //         return (
    //           <div key={index} className="scenario-item">
    //             <h3>{scenario.scenario_name}</h3>
    //             <p>{scenario.financial_goal}, {scenario.filing_status}, {scenario.state_of_residence}</p>

    //             <h4>User Info</h4>
    //             {renderField("Life Expectancy Type", scenario.user_life_expectancy_type)}
    //             {renderField("Life Expectancy Value", scenario.user_life_expectancy_value)}
    //             {renderField("Life Expectancy Mean", scenario.user_life_expectancy_mean)}
    //             {renderField("Life Expectancy Std Dev", scenario.user_life_expectancy_std_dev)}
    //             {renderField("Retirement Age", scenario.user_retirement_age_type)}
    //             {renderField("Retirement Age Value", scenario.user_retirement_age_value)}
    //             {renderField("Retirement Age Mean", scenario.user_retirement_age_mean)}
    //             {renderField("Retirement Age Std Dev", scenario.user_retirement_age_std_dev)}

    //             {/* {scenario.spouseData && Object.values(scenario.spouseData).some(v => v != null) && (
    //               <>
    //                 <h4>Spouse Info</h4>
    //                 {renderField("Life Expectancy Type", scenario.spouseData.lifeExpectancyType)}
    //                 {renderField("Life Expectancy Value", scenario.spouseData.lifeExpectancyValue)}
    //                 {renderField("Life Expectancy Mean", scenario.spouseData.lifeExpectancyMean)}
    //                 {renderField("Life Expectancy Std Dev", scenario.spouseData.lifeExpectancyStdDev)}
    //                 {renderField("Retirement Age", scenario.spouseData.retirementAge)}
    //                 {renderField("Retirement Age Value", scenario.spouseData.retirementAgeValue)}
    //                 {renderField("Retirement Age Mean", scenario.spouseData.retirementAgeMean)}
    //                 {renderField("Retirement Age Std Dev", scenario.spouseData.retirementAgeStdDev)}
    //               </>
    //             )} */}
    //           </div>
    //         );
    //       })
    //     ) : (
    //       <p className="fade-in">No scenarios available</p>
    //     )}
    //   </div>
    // </div>
    <div className="content-dashboard fade-in">
      <div className="scenarios-list">
        {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => {
            const renderFields = (fields) =>
              fields
                .filter(({ value }) => value != null)
                .map(({ label, value }) => `${label}: ${value}`)
                .join(', ');

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
                <p>{scenario.financial_goal}, {scenario.filing_status}, {scenario.state_of_residence}</p>

                <h4>User Info</h4>
                <p>{renderFields(userFields)}</p>

                {hasSpouseData && (
                  <>
                    <h4>Spouse Info</h4>
                    <p>{renderFields(spouseFields)}</p>
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
