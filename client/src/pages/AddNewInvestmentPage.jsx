import React from "react";
import InvestmentType from "../components/InvestmentType";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NewInvestmentPage = () => {
  return (
    <div className="content">
        <Header />
        <InvestmentType />
        <Footer />
    </div>
  );
};

export default NewInvestmentPage;