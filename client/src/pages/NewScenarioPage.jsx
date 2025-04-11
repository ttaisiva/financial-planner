import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import ScenarioInfo from "../components/ScenarioInfo";
import { loadAnimation } from "../utils";

const NewScenarioPage = () => {
  useEffect(() => {
    loadAnimation();
  }, []);

  const scenarioInfoRef = useRef();
  const [formData, setFormData] = useState({});


  const handleSaveScenario = async () => {
    // Trigger the form submission in ScenarioInfo component
    if (scenarioInfoRef.current) {
      scenarioInfoRef.current.handleSubmitUserInfo();
    } // scenario endpoint also pushes all local storage to database
    
  };



  return (
    <>
      <Header />
      <div className="container-new-scenario">
        <div className="content-new-scenario">
  

          {/* Pass the ref to ScenarioInfo */}
          <ScenarioInfo
            ref={scenarioInfoRef}
            formData={formData}
            setFormData={setFormData}
            className="fade-in"
          />

          <button onClick={handleSaveScenario}>Save Scenario</button>
        </div>
      </div>
    </>
  );
};

export default NewScenarioPage;
