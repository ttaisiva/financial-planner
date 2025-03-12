import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EventType from "../components/EventType";
import ScenarioInfo from "../components/ScenarioInfo";
import Strategy from "../components/Strategy";
import { Link } from "react-router-dom";


const  NewScenarioPage = () => {
  return (
    <div className="content">
      <Header />
      < ScenarioInfo />
      <EventType />
      < Strategy />
      <Link to="/AddNewInvestmentPage">
          <button>Create New Investment Type</button>
        </Link>
        <Link to="/InvestmentPage">
          <button>Create Investment</button>
        </Link>
      <button> Run Simulation </button>
      <Footer />
    </div>
  );
};

export default NewScenarioPage;