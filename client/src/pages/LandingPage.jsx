import React, { useEffect } from "react";
import LandingHeader from "../components/LandingHeader";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <>
      <LandingHeader />
      <div className="landing-content">
        <h1>Start planning your life today</h1>
        <p>
          Monitor investments and major life events at the click of a button.
          Create simulations and be in control of your future.
        </p>
        <Link to="/LoginPage" className="button-primary">
          Try it Out!
        </Link>
      </div>
    </>
  );
};

export default LandingPage;
