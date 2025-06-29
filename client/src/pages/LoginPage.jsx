import React, { useEffect } from "react";
import LandingHeader from "../components/LandingHeader";
import { Link } from "react-router-dom";
import { loadAnimation } from "../utils";
import "../styles/Landing.css";

window.handleToken = (response) => {
  fetch("http://localhost:3000/auth/google", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credential: response.credential,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status == 201) {
        // Need to finish account creation
        sessionStorage.setItem("userData", JSON.stringify(data.userdata));
        sessionStorage.setItem("credential", response.credential);
        window.location.href = "/create/account";
      } else if (data.status == 200) {
        // Logged in
        window.location.href = "/dashboard";
      }
    })
    .catch((error) => console.error("Error:", error));
};

export const handleGuest = (() => {
  // Delete any existing sessions to activate guest usage
  fetch('http://localhost:3000/auth/logout', {
    method: 'GET',
    credentials: 'include',
  })
  .then(res => {
    if (res.status == 500) {
      // ERROR DISPLAY; Unexpected server error
      window.location.href = "/";
    }
    else {
      // Successful session deletion
      window.location.href = "/dashboard";
    }
  })
});

const LoginPage = () => {
  useEffect(() => {
    loadAnimation();

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id:
          "197173313554-n6rm3gerdgdlmqpascna1uosju6jpgms.apps.googleusercontent.com",
        callback: handleToken,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("button-google"),
        {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "left",
          width: "300px",
        }
      );
    };
  }, []);

  return (
    <>
      <div className="container-landing">
        <div className="content-landing">
          <h1 className="fade-in">Login to Manatee Planner</h1>
          <div id="button-google" className="fade-in"></div>
          <p className="fade-in">
            Don't want to login?
            <Link onClick={handleGuest}> Continue as Guest</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
