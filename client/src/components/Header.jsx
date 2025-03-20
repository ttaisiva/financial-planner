import React from "react";
import "../styles/HeaderFooter.css";

import { Link } from "react-router-dom";

const Header = () => {
  const logOut = () => {
    fetch('http://localhost:3000/auth/logout', {
      method: 'GET',
      credentials: 'include',
    })
    .then((res) => {
      console.log(res);
      if (res.status != 200) {
        window.location.href = '/';
      } else {
        // !!ERROR DISPLAY!!
      }
    })
  };

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
          <li>
            <Link onClick={logOut}>Log Out</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
