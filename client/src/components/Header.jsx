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
      if (res.status == 200) {
        // !!ERROR DISPLAY!!
      }
      window.location.href = '/'; 
    })
  };

  return (
    <header>
      <Link to="/dashboard">Dashboard</Link>
      <nav>
        <ul>
          <li>
            <Link to="/resources">Resources</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
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
