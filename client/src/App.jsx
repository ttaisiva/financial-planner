import { useState } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NewScenarioPage from "./pages/NewScenarioPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AddNewInvestmentPage from "./pages/AddNewInvestmentPage.jsx"
import InvestmentPage from "./pages/InvestmentPage.jsx"

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
        <Route path="/ProfilePage" element={<ProfilePage />} />
        <Route path="/AddNewInvestmentPage" element={<AddNewInvestmentPage />} />
        <Route path="/InvestmentPage" element={<InvestmentPage />} />
      </Routes>
    </>
  );
}

export default App;
