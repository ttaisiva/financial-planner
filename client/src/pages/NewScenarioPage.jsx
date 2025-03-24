import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import { handleScenarioUpload } from "../utils";

const NewScenarioPage = () => {
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
  }

  return (
    <div className="content">
      <Header />
      <div >
        <p >Upload Scenario</p>
        <input type="file" accept=".yaml,.yml" onChange={handleFileChange} />
      </div>

      <button>Export Scenario</button>


      {/* Pass the ref to ScenarioInfo */}
      <ScenarioInfo ref={scenarioInfoRef} formData={formData} setFormData={setFormData} />

      <button onClick={handleRunSimulation}>Run Simulation</button>

      <Footer />
    </div>
  );
};

export default NewScenarioPage;