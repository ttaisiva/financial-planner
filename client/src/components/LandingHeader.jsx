import React from "react";
import "../styles/HeaderFooter.css";
// import LandingPage from "../pages/LandingPage";
import { Link } from "react-router-dom";
import {handleGuest} from "../pages/LoginPage"

const Header = () => {
  return (
    <header>
      <Link to="/" className="logo">
        Manatee Planner
      </Link>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <nav>
        <ul>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link onClick={handleGuest}>Continue as Guest</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
