import { useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NewScenarioPage from "./pages/NewScenarioPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ViewScenarioPage from "./pages/ViewScenarioPage.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create/account" element={<CreateAccountPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/create/scenario" element={<NewScenarioPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scenario" element={<ViewScenarioPage />} />
        <Route path="/scenario/:id" element={<ViewScenarioPage />} />
      </Routes>
    </>
  );
}

export default App;
