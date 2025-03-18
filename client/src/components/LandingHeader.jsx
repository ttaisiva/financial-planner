import React from "react";
import "../styles/HeaderFooter.css";
// import LandingPage from "../pages/LandingPage";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header>
      <Link to="/" className="logo">
        ManateePlanner
      </Link>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <nav>
        <ul>
          <li>
            <Link to="/DashboardPage">Sign Up</Link>
          </li>
          <li>
            <Link to="/ResourcesPage">Login</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
