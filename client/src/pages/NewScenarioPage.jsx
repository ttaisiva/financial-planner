import React, { useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import { handleScenarioUpload } from "../utils";

const NewScenarioPage = () => {
  const scenarioInfoRef = useRef();

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
        alert('Simulation completed successfully!');
      } else {
        console.error('Failed to run simulation');
        alert('Failed to run simulation');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while running the simulation');
    }
  };

  return (
    <div className="content">
      <Header />
      <div>
        <p>Upload Scenario</p>
        <input type="file" accept=".yaml,.yml" onChange={(e) => handleScenarioUpload(e)} />
      </div>

      {/* Add upload Icon to this */}
      <button>Export Scenario</button>

      {/* Pass the ref to ScenarioInfo */}
      <ScenarioInfo />

      <button onClick={handleRunSimulation}>Run Simulation</button>

      <Footer />
    </div>
  );
};

export default NewScenarioPage;
