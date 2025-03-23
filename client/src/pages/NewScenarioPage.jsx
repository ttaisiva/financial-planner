import React, { useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import { handleScenarioUpload } from "../utils";

const NewScenarioPage = () => {
  const scenarioInfoRef = useRef();
  const [formData, setFormData] = useState({});

  const handleRunSimulation = async () => {
    // Trigger the form submission in ScenarioInfo component
    if (scenarioInfoRef.current) {
      scenarioInfoRef.current.handleSubmitUserInfo();
    }

    try {
      const response = await fetch('http://localhost:3000/api/run-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Simulation run and data saved to the database');
        
      } else {
        console.error('Failed to run simulation');
        
      }
    } catch (error) {
      console.error('Error:', error);
      
    }

    // move to dashboard page? or view scenario page?
  };

  const handleFileChange = (event) => {
    handleScenarioUpload(setFormData, event);
  };

  return (
    <div className="content">
      <Header />
      <div style={{ display: "flex", alignItems: "center" }}>
        <p style={{ marginRight: "10px" }}>Upload Scenario</p>
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