import React from "react";
import Header from "src/components/Header";
import Footer from "src/components/Footer"



const DashboardPage = () => {
  return (
    <div className="dashboard-container">
      <Header />
      <EventType/> 
      <Footer />
    </div>
  );
};

export default DashboardPage;