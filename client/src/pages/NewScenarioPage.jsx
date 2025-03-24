import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import ScenarioInfo from "../components/ScenarioInfo";
import { handleScenarioUpload, loadAnimation } from "../utils";

const NewScenarioPage = () => {
  useEffect(() => {
    loadAnimation();
  }, []);

  const scenarioInfoRef = useRef();
  const [formData, setFormData] = useState({});

  const handleRunSimulation = async () => {
    // Trigger the form submission in ScenarioInfo component
    if (scenarioInfoRef.current) {
      scenarioInfoRef.current.handleSubmitUserInfo();
    }

    try {
      const response = await fetch("http://localhost:3000/api/run-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("Simulation run and data saved to the database");
      } else {
        console.error("Failed to run simulation");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    // move to dashboard page? or view scenario page?
  };

  const handleFileChange = (event) => {
    handleScenarioUpload(setFormData, event);
  };

  return (
    <>
      <Header />
      <div className="container-new-scenario">
        <div className="content-new-scenario">
          <div className="section-new-scenario">
            <h2 className="fade-in">Upload Scenario</h2>
            <div className="fade-in">
              <p>
                Already have a scenario saved? If you have a scenario stored in
                a yaml file, you may import it here.
              </p>
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button className="fade-in">Export Scenario</button>

          {/* Pass the ref to ScenarioInfo */}
          <ScenarioInfo
            ref={scenarioInfoRef}
            formData={formData}
            setFormData={setFormData}
            className="fade-in"
          />

          <button onClick={handleRunSimulation}>Run Simulation</button>
        </div>
      </div>
    </>
  );
};

export default NewScenarioPage;
