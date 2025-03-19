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
      <h2>Financial goal</h2>
      <p>
        Your financial goal is the extra amount you would like to have left over after meeting all expenses. <br></br>
        A zero financial goal means you will meet all of your expenses without a safety margin.
        <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.financialGoal} className="info-icon">⚠️</span>
        <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Financial goal: $ 
            <input
              type="number"
              min = "0"
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
          Your tax information will be used to compute federal and state income
          taxes, capital gains taxes, and early withdrawal taxes where applicable. 
          <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.taxInfo} className="info-icon">⚠️</span>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
        </p>
        {/* TODO: choose state */}
        <label>Choose your state of residence (optional) 
          <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.taxState} className="info-icon">ℹ️</span>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
        </label>

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
            Event simulation will begin in the current year. <br></br>
            Please estimate your desired retirement age and lifespan in years.
            <span data-tooltip-id="tooltip" data-tooltip-html={tooltipContent.startYearTax} className="info-icon">⚠️</span>
            <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
          </p>
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
      <p>
        Add your investments here. <br></br>
        Create your own type of investments with New Investment Type.
      </p>
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
  "filingStatus":["<p>Married is for Married Filing Jointly. <br>\
      Married Filing Separately, Head of Household, and Qualifying Surviving Spouse are currently not supported.</p>"],
  "financialGoal":["The financial goal ignores loans, mortgages, and real property such as cars and houses."],
  "startYearTax":["The simulation does not take into account previous events, investments, or income. Therefore, tax \
      payment is omitted for the first (current) year."],
  "taxInfo":["The scenario does not use your federal or state tax documents. \
    Please take a moment to read the assumptions made in place of the full tax information: <br></br> \
    1. Only the four tax types listed are computed. No other taxes will be taken into account. <br></br> \
    2. Income tax will be assumed to have standard deduction. No itemized deductions are taken into account. <br></br> \
    3. Your state may tax your capital gains differently from federal tax. This is not taken into account. <br></br> \
    4. State tax is computed the same way as federal tax, i.e. with tax rates and brackets. <br></br> \
    5. Social security income is assumed to be 85% taxable on the federal level."],
  "taxState":["Leaving this field blank will result in no state tax being computed."],
};