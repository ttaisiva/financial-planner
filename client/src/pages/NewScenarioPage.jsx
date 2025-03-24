import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ScenarioInfo from "../components/ScenarioInfo";
import { handleScenarioUpload, loadAnimation } from "../utils";

const NewScenarioPage = () => {
  useEffect(() => {
    loadAnimation();
  }, []);

  const scenarioInfoRef = useRef();
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const handleRunSimulation = async () => {
    // Trigger the form submission in ScenarioInfo component
    if (scenarioInfoRef.current) {
      scenarioInfoRef.current.handleSubmitUserInfo();
    } // scenario endpoint also pushes all local storage to database

    navigate("/ViewScenarioPage");
  };

  const handleFileChange = (event) => {
    handleScenarioUpload(setFormData, event);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
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
