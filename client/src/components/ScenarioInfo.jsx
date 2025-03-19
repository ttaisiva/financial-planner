import "../styles/NewScenario.css";
import React, { useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import EventsForm from "./EventsForm";
import { InvestmentType, Investment } from "./InvestmentDetails";


const LifeExpectancyForm = ({ prefix, data, handleChange }) => (
  <div>
    <label> {(prefix=='user' && "Your") || (prefix=='spouse' && "Spouse's")} life expectancy: </label>

    <select name={`${prefix}LifeExpectancyType`} value={data.lifeExpectancyType} onChange={handleChange}>
      <option value="" disabled>Select sample life expectancy</option>
      <option value="fixed">Fixed</option>
      <option value="dist">Normal Distribution</option>
    </select>
    <span data-tooltip-id="tooltip" data-tooltip-content={tooltipContent.lifeExpectancy} className="info-icon">ℹ️</span>
      <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

    {data.lifeExpectancyType === "fixed" ? (
      <input type="text" name={`${prefix}LifeExpectancyValue`} placeholder="Enter value" value={data.lifeExpectancyValue} onChange={handleChange} required />
    ) : data.lifeExpectancyType === "dist" ? (
      <>
        <input type="text" name={`${prefix}LifeExpectancyMean`} placeholder="Enter mean" value={data.lifeExpectancyMean} onChange={handleChange} required />
        <input type="text" name={`${prefix}LifeExpectancyStdDev`} placeholder="Enter standard deviation" value={data.lifeExpectancyStdDev} onChange={handleChange} required />
      </>
    ) : null}
  </div>
);



const RetirementAgeForm = ({ prefix, data, handleChange }) => (
  <div>
    <label> {(prefix=='user' && "Your") || (prefix=='spouse' && "Spouse's")} retirement age: </label>

    <select name={`${prefix}RetirementAge`} value={data.retirementAge} onChange={handleChange}>
      <option value="" disabled>Select sample retirement age</option>
      <option value="fixed">Fixed</option>
      <option value="dist">Normal Distribution</option>
    </select>
    <span data-tooltip-id="tooltip" data-tooltip-content={tooltipContent.retirementAge} className="info-icon">ℹ️</span>
      <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

    {data.retirementAge === "fixed" ? (
      <input type="text" name={`${prefix}RetirementAgeValue`} placeholder="Enter value" value={data.retirementAgeValue} onChange={handleChange} required />
    ) : data.retirementAge === "dist" ? (
      <>
        <input type="text" name={`${prefix}RetirementAgeMean`} placeholder="Enter mean" value={data.retirementAgeMean} onChange={handleChange} required />
        <input type="text" name={`${prefix}RetirementAgeStdDev`} placeholder="Enter standard deviation" value={data.retirementAgeStdDev} onChange={handleChange} required />
      </>
    ) : null}
  </div>
);


const ScenarioInfo = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    financialGoal: "",
    filingStatus: "single",
    userData: {
      lifeExpectancyType: "",
      lifeExpectancyValue: "",
      lifeExpectancyMean: "",
      lifeExpectancyStdDev: "",
      retirementAge: "",
      retirementAgeValue: "",
      retirementAgeMean: "",
      retirementAgeStdDev: "",
    },
    spouseData: {
      lifeExpectancyType: "",
      lifeExpectancyValue: "",
      lifeExpectancyMean: "",
      lifeExpectancyStdDev: "",
      retirementAge: "",
      retirementAgeValue: "",
      retirementAgeMean: "",
      retirementAgeStdDev: "",
    },
  });

  const [showSpouseForm, setShowSpouseForm] = useState(false);
  const [showEventsForm, setShowEventsForm] = useState(false);
  const [showInvestmentTypeForm, setShowInvestmentTypeForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  const handleAddSpouse = () => {
    setShowSpouseForm(!showSpouseForm);
  };

  const handleCreateEvent = () => {
    setShowEventsForm(true); // Show the EventsForm when button is clicked
  };

  // Helper function to update nested state objects
  const updateNestedState = (prefix, key, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [prefix]: { ...prevData[prefix], [key]: value },
    }));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    //specific updates for user and spouse
    if (name.startsWith("user")) {
      const key = name.replace("user", "").charAt(0).toLowerCase() + name.replace("user", "").slice(1);
      updateNestedState("userData", key, value);
    } else if (name.startsWith("spouse")) {
      const key = name.replace("spouse", "").charAt(0).toLowerCase() + name.replace("spouse", "").slice(1);
      updateNestedState("spouseData", key, value);
    } else { //update all other fields
      setFormData({ ...formData, [name]: value });
    }

    // Reset values when switching from "fixed" to "distribution"
    if (name.endsWith("LifeExpectancyType") && value === "fixed") {
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "lifeExpectancyMean", "");
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "lifeExpectancyStdDev", "");
    } else if (name.endsWith("LifeExpectancyType") && value === "dist") {
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "lifeExpectancyValue", "");
    }
    if (name.endsWith("RetirementAge") && value === "fixed") {
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "retirementAgeMean", "");
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "retirementAgeStdDev", "");
    } else if (name.endsWith("RetirementAge") && value === "dist") {
      updateNestedState(name.startsWith("user") ? "userData" : "spouseData", "retirementAgeValue", "");
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    

    console.log("Form Submitted with Data:", formData);
  };

  const handleInvestmentType = () => {
    setShowInvestmentTypeForm(true);
  };

  const handleInvestment = () => {
    setShowInvestmentForm(true);
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
            <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.filingStatus} className="info-icon">ℹ️</span>
            <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
          </label>
        </div>

        <div>
          <h2>Major Life Events </h2>
          <p>Add some major life events</p>
          <LifeExpectancyForm prefix="user" data={formData.userData} handleChange={handleChange} />
          <RetirementAgeForm prefix="user" data={formData.userData} handleChange={handleChange} />
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
            <LifeExpectancyForm prefix="spouse" data={formData.spouseData} handleChange={handleChange} />
            <RetirementAgeForm prefix="spouse" data={formData.spouseData} handleChange={handleChange} />
          </div>
        )}

        <button type="submit">Save</button>
      </form>

      <h2> Investment Types and Investments </h2>
      <button onClick={handleInvestmentType}>New Investment Type</button>
      {showInvestmentTypeForm && (
        <InvestmentType setShowInvestmentTypeForm={setShowInvestmentTypeForm} />
      )}

      <button onClick={handleInvestment}>New Investment</button>
      {showInvestmentForm && (
        <Investment setShowInvestmentForm={setShowInvestmentForm} />
      )}

      <h2> Event Series</h2>
      <button onClick={handleCreateEvent}>New Event</button>
      {showEventsForm && <EventsForm setShowEventsForm={setShowEventsForm} />}
    </div>
  );
};

export default ScenarioInfo;

// TODO: there should probably be a file of this but idk where
const tooltipContent={ 
  "lifeExpectancy":["Explanation of the life exp. options"], 
  "retirementAge":["Explanation of the retirement age options"],
  "filingStatus":['<p>Married is for Married Filing Jointly. <br>\
      Married Filing Separately, Head of Household, and Qualifying Surviving Spouse are currently not supported.</p>'],
};