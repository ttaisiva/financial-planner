import React from "react";
import DashboardPage from "./DashboardPage";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <>
      <header />
      <div className="content">
        <h1>This is Landing Page</h1>
        {/* <button>
        <Link to="/signup">Sign Up</Link>
      </button> */}
        {/* <button>
        <Link to="/login">Login</Link>
      </button> */}
        <button>
          <Link to="/DashboardPage">Guest</Link>
        </button>
      </div>
    </>
  );
};

export default LandingPage;
