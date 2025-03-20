import { useState } from "react";
import "./App.css";
import { Routes, Route} from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import CreateAccountPage from "./pages/CreateAccountPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import NewScenarioPage from "./pages/NewScenarioPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";


function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/CreateAccount" element={<CreateAccountPage />} />
        <Route path="/DashboardPage" element={<DashboardPage />} />
        <Route path="/NewScenarioPage" element={<NewScenarioPage />} />
        <Route path="/ResourcesPage" element={<ResourcesPage />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
      </Routes>
    </>
  );
}

export default App;
