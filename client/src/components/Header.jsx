import React from "react";
import "../styles/HeaderFooter.css";

import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header>
      <Link to="/DashboardPage">Dashboard</Link>
      <nav>
        <ul>
          <li>
            <Link to="/ResourcesPage">Resources</Link>
          </li>
          <li>
            <Link to="/ProfilePage">Profile</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
