import React from "react";
import "../styles/HeaderFooter.css";
import DashboardPage from "../pages/DashboardPage";
import ResourcesPage from "../pages/ResourcesPage";

import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <button>
              <Link to="/DashboardPage">Dashboard</Link>
            </button>
          </li>
          <li>
            <button>
              <Link to="/ResourcesPage">Resources</Link>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
