import React, {useEffect} from "react";
import DashboardPage from "./DashboardPage";
import LandingHeader from "../components/LandingHeader";
import { Link } from "react-router-dom";

window.handleToken = (response) => {
  fetch('http://localhost:8000/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify({
      credential: response.credential,
    })
  })
    .then(response => response.json()) 
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
};

const LandingPage = () => {

  return (
    <>
      <LandingHeader />
      <div className="content">
        <h1>This is Landing Page</h1>
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
        <Link to="/DashboardPage">Guest</Link>
        {/* </button> */}
        
      </div>
    </>
  );
};

export default LandingPage;
