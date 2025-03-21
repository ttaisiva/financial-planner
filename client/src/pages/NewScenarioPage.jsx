import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import Strategy from "../components/Strategy";
import { handleScenarioUpload } from "../utils";


const  NewScenarioPage = () => {
  

  return (
    <div className="content">
      <Header />
      <div>
        <p> Upload Scenario </p>
        <input type="file" accept=".yaml,.yml" onChange={(e) => handleScenarioUpload(e)} />
      </div>

      {/*Add upload Icon to this */}
      <button> Export Scenario </button>
      
      < ScenarioInfo />
      
      <Footer />
    </div>
  );
};

export default NewScenarioPage;