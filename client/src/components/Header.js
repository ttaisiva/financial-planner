import React from 'react';
import "../styles/HeaderFooter.css";

const Header = () => {
  return (
    <header>
      <nav>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#resources">Resources</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;