import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      {/* <h1>TEST</h1> */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
      </Routes>
    </>
  );
}

export default App;
