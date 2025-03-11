import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EventType from "../components/EventType";
import ScenarioInfo from "../components/ScenarioInfo";



const  NewScenarioPage = () => {
  return (
    <div className="newscenario-container">
      <Header />
      < ScenarioInfo />
      {/*<EventType /> */}
      <Footer />
    </div>
  );
};

export default NewScenarioPage;