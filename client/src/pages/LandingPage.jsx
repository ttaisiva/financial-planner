import React, { useEffect } from "react";
import LandingHeader from "../components/LandingHeader";
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";
import "../styles/Landing.css";

const LandingPage = () => {
  useEffect(() => {
    loadAnimation();
  }, []);

  return (
    <>
      <LandingHeader />
      <div className="container-landing">
        <div className="content-landing">
          <h1 className="fade-in-up">Start planning your life today</h1>
          <p className="landing fade-in-up">
            Monitor investments and major life events.
            <br />
            Create simulations and view informational charts.
            <br />
            Be in control of your future.
          </p>
          <Link to="/LoginPage" className="button-action fade-in-up">
            Try it Out!
          </Link>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
