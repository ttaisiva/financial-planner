import "../styles/NewScenario.css";
import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import EventsForm from "./EventsForm";
import { InvestmentType, Investment, ViewInvestmentDetails } from "./InvestmentDetails";
import { states, tooltipContent, handleFileUpload } from "../utils";
import Strategy from "./Strategy";



const LifeExpectancyForm = ({ prefix, data, handleChange }) => (
  <div>
    <label> {(prefix === 'user' && "Your") || (prefix === 'spouse' && "Spouse's")} life expectancy: </label>
    <select name={`${prefix}LifeExpectancyType`} value={data.lifeExpectancyType} onChange={handleChange}>
      <option value="" disabled>Select sample life expectancy</option>
      <option value="fixed">Fixed</option>
      <option value="dist">Normal Distribution</option>
    </select>
    <span data-tooltip-id="tooltip" data-tooltip-content={tooltipContent.lifeExpectancy} className="info-icon">ℹ️</span>
    <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
    {data.lifeExpectancyType === "fixed" ? (
      <input type="number" min="0" name={`${prefix}LifeExpectancyValue`} placeholder="Enter value" value={data.lifeExpectancyValue} onChange={handleChange} required />
    ) : data.lifeExpectancyType === "dist" ? (
      <>
        <input type="number" min="0" name={`${prefix}LifeExpectancyMean`} placeholder="Enter mean" value={data.lifeExpectancyMean} onChange={handleChange} required />
        <input type="number" min="0" name={`${prefix}LifeExpectancyStdDev`} placeholder="Enter standard deviation" value={data.lifeExpectancyStdDev} onChange={handleChange} required />
      </>
    ) : null}
  </div>
);

const RetirementAgeForm = ({ prefix, data, handleChange }) => (
  <div>
    <label> {(prefix === 'user' && "Your") || (prefix === 'spouse' && "Spouse's")} retirement age: </label>
    <select name={`${prefix}RetirementAge`} value={data.retirementAge} onChange={handleChange}>
      <option value="" disabled>Select sample retirement age</option>
      <option value="fixed">Fixed</option>
      <option value="dist">Normal Distribution</option>
    </select>
    <span data-tooltip-id="tooltip" data-tooltip-content={tooltipContent.retirementAge} className="info-icon">ℹ️</span>
    <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
    {data.retirementAge === "fixed" ? (
      <input type="number" min="0" name={`${prefix}RetirementAgeValue`} placeholder="Enter value" value={data.retirementAgeValue} onChange={handleChange} required />
    ) : data.retirementAge === "dist" ? (
      <>
        <input type="number" min="0" name={`${prefix}RetirementAgeMean`} placeholder="Enter mean" value={data.retirementAgeMean} onChange={handleChange} required />
        <input type="number" min="0" name={`${prefix}RetirementAgeStdDev`} placeholder="Enter standard deviation" value={data.retirementAgeStdDev} onChange={handleChange} required />
      </>
    ) : null}
  </div>
);

const ScenarioInfo = forwardRef((props, ref) => {
  // State to manage form data
  const [formData, setFormData] = useState({
    scenarioName: "",
    financialGoal: "",
    filingStatus: "single",
    stateOfResidence: "",
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
  const [investments, setInvestments] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);

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

  const handleSubmitUserInfo = async (e) => {
    if (e) e.preventDefault();
    console.log("User Scenario Info Submitted:", formData);

    try {
      const response = await fetch('http://localhost:3000/api/user-scenario-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('User details saved successfully');
      } else {
        console.error('Failed to save user details');
      }
    } catch (error) {
      console.error('Error:', error);
    }

    console.log("Form Submitted with Data:", formData);
  };

  // Expose handleSubmitUserInfo to parent component
  useImperativeHandle(ref, () => ({
    handleSubmitUserInfo,
  }));

  const handleInvestmentType = () => {
    setShowInvestmentTypeForm(true);
  };

  const handleInvestment = () => {
    setShowInvestmentForm(true);
  };

  return (
    <div className="scenario_info-container">
      
      <h2>Financial goal</h2>
      <p>
        Your financial goal is the extra amount you would like to have left over after meeting all expenses. <br />
        A zero financial goal means you will meet all of your expenses without a safety margin.
        <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.financialGoal} className="info-icon">⚠️</span>
      </p>
      <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

      <form onSubmit={handleSubmitUserInfo}>
        <div>
          <label>
            Scenario Name: 
            <input type="text" name="scenarioName" value={formData.scenarioName} placeholder="Enter scenario name" onChange={handleChange} required/>
          </label>
          
          <label>
            Financial goal: $ 
            <input
              type="number"
              min="0"
              name="financialGoal"
              value={formData.financialGoal}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </label>
        </div>

        <h2>Tax Information</h2>
        <p>
          Your tax information will be used to compute federal and state income taxes, capital gains taxes, and early withdrawal taxes where applicable. 
          <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.taxInfo} className="info-icon">⚠️</span>
        </p>
        <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
        
        <label>Choose your state of residence (optional) 
          <select name="stateOfResidence" value={formData.stateOfResidence} onChange={handleChange}>
            <option value="">Select your state</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.taxState} className="info-icon">ℹ️</span>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
        </label>

        <input type="file" accept=".yaml,.yml" onChange={(e) => handleFileUpload(e)} />

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
          <p>
            Event simulation will begin in the current year. <br />
            Please estimate your desired retirement age and lifespan in years.
            <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.startYearTax} className="info-icon">⚠️</span>
          </p>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

          <LifeExpectancyForm prefix="user" data={formData.userData} handleChange={handleChange} />
          <RetirementAgeForm prefix="user" data={formData.userData} handleChange={handleChange} />
        </div>

        <div>
          <button type="button" onClick={handleAddSpouse}>
            {showSpouseForm ? "Remove Spouse" : "Add Spouse"}
          </button>
        </div>

        {showSpouseForm && (
          <div>
            <h3>Spouse Information</h3>
            <LifeExpectancyForm prefix="spouse" data={formData.spouseData} handleChange={handleChange} />
            <RetirementAgeForm prefix="spouse" data={formData.spouseData} handleChange={handleChange} />
          </div>
        )}
      </form>

      <h2>Investment Types and Investments</h2>
      <button onClick={handleInvestmentType}>New Investment Type</button>
      {showInvestmentTypeForm && (
        <InvestmentType investmentTypes={investmentTypes} setInvestmentTypes={setInvestmentTypes} setShowInvestmentTypeForm={setShowInvestmentTypeForm} />
      )}

      <button onClick={handleInvestment}>New Investment</button>
      {showInvestmentForm && (
        <Investment investments={investments} setInvestments={setInvestments} setShowInvestmentForm={setShowInvestmentForm}  />
      )}

      <ViewInvestmentDetails investments={investments} investmentTypes={investmentTypes} />

      <button  onClick={handleCreateEvent} > Create Event </button>
      {showEventsForm && <EventsForm setShowEventsForm={ setShowEventsForm }/>}

      <Strategy investments={investments}/>
    </div>
  );
});

export default ScenarioInfo;
