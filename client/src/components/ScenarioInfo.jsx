import "../styles/NewScenario.css";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {EventsForm, ViewEventsDetails } from "./EventsForm";
import {
  InvestmentType,
  Investment,
  ViewInvestmentDetails,
} from "./InvestmentDetails";
import {
  states,
  tooltipContent,
  handleFileUpload,
  loadAnimation,
} from "../utils";
import Strategy from "./Strategy";
import { inputTypes, updateNestedState} from '../utils';
import { useNavigate } from "react-router-dom";

//maybe move these to utils
const LifeExpectancyForm = ({ prefix, handleChange, formData }) => {

  return (
  <div className="section-new-scenario">
    <label>
      <h4>
        {" "}
        {(prefix === "user" && "Your") ||
          (prefix === "spouse" && "Spouse's")}{" "}
        life expectancy:{" "}
      </h4>
    </label>

    <div>
      <select
        name={`${prefix}.lifeExpectancy.type`}
        value={formData[prefix]?.lifeExpectancy?.type}
        onChange={handleChange}
      >
        <option value="" disabled>Select sample life expectancy</option>
        <option value="fixed">Fixed</option>
        <option value="normal_distribution">Normal Distribution</option>
      </select>

      <span
        data-tooltip-id="tooltip"
        data-tooltip-content={tooltipContent.lifeExpectancy}
        className="info-icon"
      >
        ℹ️
      </span>
   
      {inputTypes({type: formData[`${prefix}`]?.lifeExpectancy?.type, formData, handleChange, prefix: `${prefix}.lifeExpectancy` })}
      
    </div>

    <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

  </div>
  );
}

const RetirementAgeForm = ({ prefix, handleChange, formData }) =>  (
  <div className="section-new-scenario">
    <label>
      <h4>
        {" "}
        {(prefix === "user" && "Your") ||
          (prefix === "spouse" && "Spouse's")}{" "}
        retirement age:{" "}
      </h4>
    </label>

    <div>
      <select
        name={`${prefix}.retirementAge.type`}
        value={formData[prefix]?.retirementAge?.type}
        onChange={handleChange}
      >
        <option value="" disabled>Select sample life expectancy</option>
        <option value="fixed">Fixed</option>
        <option value="normal_distribution">Normal Distribution</option>
      </select>

      <span
        data-tooltip-id="tooltip"
        data-tooltip-content={tooltipContent.retirementAge}
        className="info-icon"
      >
        ℹ️
      </span>

      {inputTypes({type: formData[`${prefix}`]?.retirementAge?.type, formData, handleChange, prefix: `${prefix}.retirementAge` })}
      
    </div>

  </div>
  );
  

const ScenarioInfo = forwardRef((props, ref) => {
  useEffect(() => {
    loadAnimation();

  });

  const navigate = useNavigate();

  // State to manage form data
  const [formData, setFormData] = useState({
    scenarioName: "",
    financialGoal: "",
    filingStatus: "single",
    stateOfResidence: "",
    user: {
      lifeExpectancy: {
        type: "", 
        value: "", 
        meanean: "",  
        stdDev: "", 
      
      },
      retirementAge: {
        type: "", 
        value: "", 
        mean: "",  
        stdDev: "", 
      }
   
    },
    spouse: {
      lifeExpectancy: {
        type: "", 
        value: "", 
        mean: "",  
        stdDev: "", 
      
      },
      retirementAge: {
        type: "", 
        value: "", 
        mean: "",  
        stdDev: "", 
      }
    },
    inflation_assumption: {
      type: "", 
      value: "", 
      mean: "",  
      stdDev: "", 
      lower: "", 
      upper: "", 
    }
  });

  const [showSpouseForm, setShowSpouseForm] = useState(false);
  const [showEventsForm, setShowEventsForm] = useState(false);
  const [showInvestmentTypeForm, setShowInvestmentTypeForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [events, setEvents] = useState([]);

  const handleAddSpouse = () => {
    setShowSpouseForm(!showSpouseForm);
  };

  const handleCreateEvent = () => {
    setShowEventsForm(true); // Show the EventsForm when button is clicked
  };
 

  
  // Handle input changes -> maybe modularize this a bit (you could probably combine inflation assumptino with user and spouse)
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log("name and value: ", name, value)

  
    const parts = name.split(".");
    const parentKey = parts[0];  // inflation_assumption
    const childKey = parts[1];   // type
    
    if (name.startsWith("inflation_assumption")) {  //nested once
      updateNestedState(parentKey, childKey, value, setFormData);

    } else if (name.startsWith("user") || name.startsWith("spouse"))  { //nested twice
      const subKey = parts[2];     // 'Type'
      const parent_child = `${parentKey}.${childKey}`
      updateNestedState(parent_child, subKey, value, setFormData);

    } else {
      //update all other fields that are not stupidly nested
      setFormData({ ...formData, [name]: value });
    }

  };





  const handleSubmitUserInfo = async (e) => {
    if (e) e.preventDefault();
    console.log("User Scenario Info Submitted:", formData);

    try {
      const response = await fetch('http://localhost:3000/api/user-scenario-info', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      console.log(response);

      if (response.ok) {
        const data = await response.json();
        console.log("Scenario saved successfully:", data);
        console.log("scenario id: ", data.scenario_id);
        navigate("/scenario", { state: { scenario_id: data.scenario_id } });
      } else {
        console.error("Failed to save user details");
      }
    } catch (error) {
      console.error("Error:", error);
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
    <div className="section-new-scenario">
      <form onSubmit={handleSubmitUserInfo}>
        <h1 className="fade-in">New Scenario</h1>
        <label>
          <h2 className="fade-in">Scenario Name</h2>
        </label>
        <div className="fade-in">
          <input
            type="text"
            name="scenarioName"
            value={formData.scenarioName}
            placeholder="Enter scenario name"
            onChange={handleChange}
            required
          />
        </div>

        <h2 className="fade-in">Financial goal</h2>
        <div className="fade-in">
          <p>
            Your financial goal is the extra amount you would like to have left
            over after meeting all expenses. <br />A zero financial goal means
            you will meet all of your expenses without a safety margin.
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.financialGoal}
              className="info-icon"
            >
              ℹ️
            </span>
          </p>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

          <label>
            <h4>Financial goal (in $):</h4>
          </label>
          <div>
            <input
              type="number"
              min="0"
              name="financialGoal"
              value={formData.financialGoal}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <h2 className="fade-in">Tax Information</h2>
        <div className="fade-in">
          <p>
            Your tax information will be used to compute federal and state
            income taxes, capital gains taxes, and early withdrawal taxes where
            applicable.
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.taxInfo}
              className="info-icon"
            >
              ℹ️
            </span>
          </p>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

          <label>
            <h4>Choose your state of residence (optional):</h4>
          </label>

          <div>
            <select
              name="stateOfResidence"
              value={formData.stateOfResidence}
              onChange={handleChange}
            >
              <option value="">Select your state</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.taxState}
              className="info-icon"
            >
              ℹ️
            </span>
          </div>

          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

          <input
            type="file"
            accept=".yaml,.yml"
            onChange={(e) => handleFileUpload(e)}
          />

          <label>
            <h4>Filing Status:</h4>
          </label>

          <div>
            <select
              name="filingStatus"
              value={formData.filingStatus}
              onChange={handleChange}
              required
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.filingStatus}
              className="info-icon"
            >
              ℹ️
            </span>
            <ReactTooltip
              id="tooltip"
              place="right"
              type="info"
              effect="solid"
            />
          </div>
        </div>


        <div>
          <label>Inflation Assumption: </label>
          <select name="inflation_assumption.type" value={formData.inflation_assumption.type} onChange={handleChange} required>
            <option value="" disabled>Select format</option>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>

          {inputTypes({ type: formData.inflation_assumption.type, formData, handleChange, prefix: "inflation_assumption"  })}
          {console.log("form Data", formData)}
        </div>

        <h2 className="fade-in">Major Life Events </h2>
        <div className="fade-in">
          <p>
            Event simulation will begin in the current year. <br />
            Please estimate your desired retirement age and lifespan in years.
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.startYearTax}
              className="info-icon"
            >
              ℹ️
            </span>
          </p>
          <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

          <LifeExpectancyForm
            prefix="user"
            handleChange={handleChange}
            formData={formData}
          />
          <RetirementAgeForm
            prefix="user"
            handleChange={handleChange}
            formData={formData}
          />
        </div>

        <h2 className="fade-in">Add Spouse</h2>
        <div className="fade-in">
          <button type="button" onClick={handleAddSpouse}>
            {showSpouseForm ? "Remove Spouse" : "Add Spouse"}
          </button>
        </div>

        {showSpouseForm && (
          <div>
            <h3>Spouse Information</h3>
            <LifeExpectancyForm
              prefix="spouse"
              handleChange={handleChange}
              formData={formData}
            />
            <RetirementAgeForm
              prefix="spouse"
              handleChange={handleChange}
              formData={formData}
            />
          </div>
        )}


      </form>

      <h2 className="fade-in">Investment Types and Investments</h2>
      <div className="fade-in">
        <button onClick={handleInvestmentType}>New Investment Type</button>
        {showInvestmentTypeForm && (
          <InvestmentType
            investmentTypes={investmentTypes}
            setInvestmentTypes={setInvestmentTypes}
            setShowInvestmentTypeForm={setShowInvestmentTypeForm}
          />
        )}
      </div>

      <div className="fade-in">
        <button onClick={handleInvestment}>New Investment</button>
        {showInvestmentForm && (
          <Investment
            investments={investments}
            setInvestments={setInvestments}
            setShowInvestmentForm={setShowInvestmentForm}
          />
        )}
      </div>
      <div>
        <ViewInvestmentDetails investments={investments} investmentTypes={investmentTypes} />
      </div>

      <h2 className="fade-in">Event Series</h2>
      <p> Event series is a sequence of annual events. You may choose income, expense, invest,
        or rebalance events that will happen every year within a desired time range.
        <span
          data-tooltip-id="tooltip"
          data-tooltip-html={tooltipContent.eventSeries}
          className="info-icon"
        >
          ℹ️
        </span>
        <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />

      </p>
      

      <div className="fade-in">
        <button  onClick={handleCreateEvent} > Create Event </button>
        {showEventsForm && <EventsForm     
            events={events}
            setEvents={setEvents}
            setShowEventsForm={ setShowEventsForm }/>}

        <ViewEventsDetails events={events} />
 
      </div>
    
      <div className="fade-in">
        <Strategy investments={investments} showEventsForm={showEventsForm} />
      </div>
    </div>
  );
});

export default ScenarioInfo;
