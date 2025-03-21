import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import Strategy from "../components/Strategy";


const  NewScenarioPage = () => {
  

  return (
    <div className="content">
      <Header />
      {/*implement functionality for upload and export scenario */}
      <button> Upload Scenario </button>
      <button> Export Scenario </button>
      
      < ScenarioInfo />
      
      <Footer />
    </div>
  );
};

export default NewScenarioPage;