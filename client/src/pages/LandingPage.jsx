import React from "react";
import LandingHeader from "../components/LandingHeader";
import { Link } from "react-router-dom";

window.handleToken = (response) => {
  fetch('http://localhost:3000/auth/google', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify({
      credential: response.credential,
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.status == 201) { // Need to finish account creation
      sessionStorage.setItem('userData', JSON.stringify(data.userdata));
      sessionStorage.setItem('credential', response.credential); 
      window.location.href = 'http://localhost:5173/CreateAccount';
    }
    else if (data.status == 200) { // Logged in
      window.location.href = 'http://localhost:5173/Dashboard';
    }
  })
  .catch(error => console.error('Error:', error));
};

const LandingPage = () => {
  return (
    <>
      <LandingHeader />
      <div className="landing-content">
        <h1>Manatee Planner</h1>
        <div id="g_id_onload"
          data-client_id="197173313554-n6rm3gerdgdlmqpascna1uosju6jpgms.apps.googleusercontent.com"
          data-context="signin"
          data-ux_mode="popup"
          data-callback="handleToken"
          data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
          data-type="standard"
          data-shape="pill"
          data-theme="outline"
          data-text="continue_with"
          data-size="large"
          data-logo_alignment="left">
        </div>
        <Link to="/DashboardPage">Continue as Guest</Link>
        
      </div>
    </>
  );
};

export default LandingPage;
