import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScenarioInfo from "../components/ScenarioInfo";
import Strategy from "../components/Strategy";


const  NewScenarioPage = () => {
  

  return (
    <div className="content">
      <Header />
      <button> Upload Scenario </button>
      < ScenarioInfo />
      < Strategy /> 
      <Footer />
    </div>
  );
};

export default NewScenarioPage;