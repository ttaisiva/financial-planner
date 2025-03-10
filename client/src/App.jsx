import { useState } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NewScenarioPage from "./pages/NewScenarioPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}

        <Route path="/DashboardPage" element={<DashboardPage />} />
        <Route path="/NewScenarioPage" element={<NewScenarioPage />} />
        <Route path="/ResourcesPage" element={<ResourcesPage />} />
      </Routes>
    </>
  );
}

export default App;
