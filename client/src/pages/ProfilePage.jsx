import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  return (
    <div>
      <Header />
      <p> this is profile</p>
      <Link to="/">Log Out</Link>
      <Footer />
    </div>
  );
};

export default ProfilePage;
