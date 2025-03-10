import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";

const DashboardPage = () => {
  return (
    <div className="content">
      <Header />
      <Dashboard />
      <Footer />
    </div>
  );
};

export default DashboardPage;
