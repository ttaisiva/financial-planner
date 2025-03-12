import React from "react";
import Investment from "../components/Investment";
import Header from "../components/Header";
import Footer from "../components/Footer";

const InvestmentPage = () => {
  return (
    <div className="content">
        <Header />
        <Investment/>
        <Footer />
    </div>
  );
};

export default InvestmentPage;