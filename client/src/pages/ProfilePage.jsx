import React, { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Profile from "../components/Profile";
import { loadAnimation } from "../utils";

export const ProfilePage = () => {
  useEffect(() => {
      loadAnimation();
    });

  return (
    <div>
      <Header />
      <Profile />
      <Footer />
    </div>
  );
};

export default ProfilePage;
