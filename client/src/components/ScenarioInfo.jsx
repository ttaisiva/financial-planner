import "../styles/NewScenario.css";
import React, { useState } from "react";
import EventsForm from "./EventsForm";


const ScenarioInfo = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    financialGoal: "",
    filingStatus: "single", 
    userData: { retirementAge: "", lifeExpectancy: "" },
    spouseData: { retirementAge: "", lifeExpectancy: "" },
    
  });


  const [showSpouseForm, setShowSpouseForm] = useState(false);
  const [showEventsForm, setShowEventsForm] = useState(false);

  const handleAddSpouse = () => {
    setShowSpouseForm(!showSpouseForm);
  };

  const handleCreateEvent = () => {
    setShowEventsForm(true); // Show the EventsForm when button is clicked
  };

  // Handle input changes 
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData) {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({
        ...formData,
        spouseData: { ...formData.spouseData, [name]: value },
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    //need to send stuff to MYSQL

    console.log("Form Submitted with Data:", formData);
  };

  return (
    <div className="scenario_info-container">

      <h2>Financial Goal</h2>
      <p>Enter your desired wealth goal</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Financial Goal:
            <input
              type="text"
              name="financialGoal"
              value={formData.financialGoal}
              onChange={handleChange}
              placeholder="Value"
              required
            />
          </label>
        </div>

        <h2>Tax Information</h2>
        <p>Upload your tax information</p>
        <div>
        <label>
            Filing Status:
            <select
              name="filingStatus"
              value={formData.filingStatus}
              onChange={handleChange}
              required
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </label>
        </div>

        <h2>Major Life Events </h2>
        <p>Add some major life events</p>
        <div>
          <label>
            My Life Expectancy:
            <input
              type="text"
              name="userLifeExpectancy"
              value={formData.userLifeExpectancy}
              onChange={handleChange}
              placeholder="Value"
              required
            />
          </label>
          <label>
            Retirement Age:
            <input
              type="text"
              name="userRetirementAge"
              value={formData.userRetirementAge}
              onChange={handleChange}
              placeholder="Value"
              required
            />
          </label>
        </div>

        {/* Add Spouse Button */}
        <div>
          <button type="button" onClick={handleAddSpouse}>
            {showSpouseForm ? "Remove Spouse" : "Add Spouse"}
          </button>
        </div>

        {/* Spouse Form (conditional display based on showSpouseForm state) */}
        {showSpouseForm && (
          <div>
            <h3>Spouse Information</h3>
            <div>
              <label>
                Spouse's Life Expectancy:
                <input
                  type="text"
                  name="lifeExpectancy"
                  value={formData.spouseData.lifeExpectancy}
                  onChange={handleChange}
                  placeholder="Enter spouse's life expectancy"
                  required
                />
              </label>
              <label>
                Spouse's Retirement Age:
                <input
                  type="text"
                  name="retirementAge"
                  value={formData.spouseData.retirementAge}
                  onChange={handleChange}
                  placeholder="Enter spouse's retirement age"
                  required
                />
              </label>
            </div>
          </div>
        )}

        <button type="submit">Save</button>
      </form>


      <h2> Event Series</h2>
      <button onClick={handleCreateEvent} > Create New Event </button>
      {showEventsForm && <EventsForm />}
      
      
    </div>
  );
};

export default ScenarioInfo;
