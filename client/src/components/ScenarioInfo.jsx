import "../styles/NewScenario.css";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { EventsForm, ViewEventsDetails } from "./EventsForm";
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
import { inputTypes, updateNestedState } from "../utils";
import { useNavigate } from "react-router-dom";
import { cleanScenario } from "../utils";

//maybe move these to utils
const LifeExpectancyForm = ({ prefix, handleChange, formData }) => {
  const key = prefix === "user" ? "userLifeExpectancy" : "spouseLifeExpectancy";

  return (
    <div className="section-new-scenario">
      <label htmlFor={`${key}-type`}>
        <h4>
          {" "}
          {(prefix === "user" && "Your") ||
            (prefix === "spouse" && "Spouse's")}{" "}
          life expectancy:{" "}
        </h4>
      </label>

      <div>
        <select
          id={`${key}-type`}
          name={`${key}.type`}
          value={formData[key]?.type}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select sample life expectancy
          </option>
          <option value="fixed">Fixed</option>
          <option value="normal">Normal Distribution</option>
        </select>

        <span
          data-tooltip-id="tooltip"
          data-tooltip-content={tooltipContent.lifeExpectancy}
          className="info-icon"
        >
          ℹ️
        </span>

        {inputTypes({
          type: formData[`${key}`]?.type,
          formData,
          handleChange,
          prefix: key,
        })}
      </div>

      <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
    </div>
  );
};

const RetirementAgeForm = ({ prefix, handleChange, formData }) => (
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
        <option value="" disabled>
          Select sample life expectancy
        </option>
        <option value="fixed">Fixed</option>
        <option value="normal">Normal Distribution</option>
      </select>

      <span
        data-tooltip-id="tooltip"
        data-tooltip-content={tooltipContent.retirementAge}
        className="info-icon"
      >
        ℹ️
      </span>

      {inputTypes({
        type: formData[`${prefix}`]?.retirementAge?.type,
        formData,
        handleChange,
        prefix: `${prefix}.retirementAge`,
      })}
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
    name: "",
    financialGoal: "",
    maritalStatus: "individual",
    residenceState: "",
    userLifeExpectancy: {
      type: "",
      value: "",
      mean: "",
      stdev: "",
    },
    spouseLifeExpectancy: {
      type: "",
      value: "",
      mean: "",
      stdev: "",
    },
    userBirthYear: "",
    spouseBirthYear: "",
    inflationAssumption: {
      type: "",
      value: "",
      mean: "",
      stdev: "",
      lower: "",
      upper: "",
    },
    afterTaxContributionLimit: "",
  });

  // Cash Investment Form. handleSubmitUserInfo() handles inserting cash investment data into database
  const [cashData, setCashData] = useState({
    id: "cash",
    investmentType: "cash",
    value: 0,
    taxStatus: "non-retirement",
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

    console.log("name and value: ", name, value);

    const parts = name.split(".");
    const parentKey = parts[0]; // inflationAssumption
    const childKey = parts[1]; // type

    if (
      name.startsWith("inflationAssumption") ||
      name.startsWith("userLifeExpectancy") ||
      name.startsWith("spouseLifeExpectancy")
    ) {
      //nested once
      updateNestedState(parentKey, childKey, value, setFormData);
    } else {
      //update all other fields that are not stupidly nested
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmitUserInfo = async (e) => {
    if (e) e.preventDefault();
    console.log("User Scenario Info Submitted:", formData);

    // Clean cash investment dollar vale
    const parsedValue = parseFloat(cashData.value);
    const cleanValue = isNaN(parsedValue) ? 0 : parsedValue;

    const finalCashData = {
      // Sets to clean value in case of NaN entry
      ...cashData,
      value: cleanValue,
    };

    // Correctly format the scenario form data
    const cleanedFormData = cleanScenario(formData);

    const scenarioData = {
      name: cleanedFormData.name,
      financialGoal: cleanedFormData.financialGoal,
      maritalStatus: cleanedFormData.maritalStatus,
      residenceState: cleanedFormData.residenceState,
      lifeExpectancy: JSON.stringify([
        cleanedFormData.userLifeExpectancy,
        cleanedFormData.spouseLifeExpectancy,
      ]),
      birthYears: JSON.stringify([
        cleanedFormData.userBirthYear,
        cleanedFormData.spouseBirthYear,
      ]),
      inflationAssumption: JSON.stringify(cleanedFormData.inflationAssumption),
      afterTaxContributionLimit: cleanedFormData.afterTaxContributionLimit,
    };

    const fullData = { scenario: scenarioData, cashData: finalCashData };

    // Insert User Scenario Info into database
    try {
      const response = await fetch(
        "http://localhost:3000/api/create-scenario",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullData),
        }
      );

      console.log(response);

      if (response.ok) {
        const data = await response.json();
        console.log("Scenario saved successfully:", data);
        console.log("scenario id: ", data.scenario_id);
        navigate(`/scenario/${data.scenario_id}`);
      } else {
        console.error("Failed to save user details");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    console.log("Form Submitted with Data:", cashData);
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

  const handleCashChange = (e) => {
    const { name, value } = e.target;

    // Allow empty input so users can clear the field
    if (value === "") {
      setCashData({ ...cashData, [name]: value });
      return;
    }

    // Allow only up to 2 decimals
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value)) {
      setCashData({ ...cashData, [name]: value });
    }
  };

  return (
    <div className="section-new-scenario">
      <form onSubmit={handleSubmitUserInfo}>
        <h1>New Scenario</h1>
        <div className="divider"></div>

        <label htmlFor="scenario-name">
          <h2>Scenario Name</h2>
        </label>
        <div>
          <input
            id="scenario-name"
            type="text"
            name="name"
            value={formData.name}
            placeholder="Enter scenario name"
            onChange={handleChange}
            required
          />
        </div>

        <div className="divider"></div>
        <h2>Financial goal</h2>
        <div>
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

          <label htmlFor="financial-goal">
            <h4>Financial goal (in $):</h4>
          </label>
          <div>
            <input
              id="financial-goal"
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

        <div className="divider"></div>
        <h2>Tax Information</h2>
        <div>
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

          <label htmlFor="residence-state">
            <h4>Choose your state of residence (optional):</h4>
          </label>

          <div>
            <select
              id="residence-state"
              name="residenceState"
              value={formData.residenceState}
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

          <label htmlFor="filing-status">
            <h4>Filing Status:</h4>
          </label>

          <div>
            <select
              id="filing-status"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              required
            >
              <option value="individual">Individual</option>
              <option value="couple">Couple</option>
            </select>
            <span
              data-tooltip-id="tooltip"
              data-tooltip-html={tooltipContent.maritalStatus}
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

        <label htmlFor="inflation-assumption">
          <h4>Inflation Assumption %:</h4>
        </label>

        <div>
          <select
            id="inflation-assumption"
            name="inflationAssumption.type"
            value={formData.inflationAssumption.type}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select format
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal">Normal Distribution</option>
            <option value="uniform">Uniform Distribution</option>
          </select>

          {inputTypes({
            type: formData.inflationAssumption.type,
            formData,
            handleChange,
            prefix: "inflationAssumption",
          })}
          {console.log("form Data", formData)}
        </div>

        <label htmlFor="after-tax-contribution-limit">
          <h4>After-Tax Contribution Limit:</h4>
        </label>
        <p>
          {" "}
          Initial limit on annual contributions to after-tax retirement
          accounts. Limits are is imposed by the IRS. It is inflation-adjusted,
          i.e., assumed to increase annually at the rate of inflation.
        </p>

        <div>
          <input
            id="after-tax-contribution-limit"
            type="number"
            min="0"
            name="afterTaxContributionLimit"
            value={formData.afterTaxContributionLimit}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="divider"></div>
        <h2>Major Life Events </h2>
        <div>
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
          {/* <RetirementAgeForm
            prefix="user"
            handleChange={handleChange}
            formData={formData}
          /> */}

          <div>
            <label htmlFor="user-birth-year">
              {" "}
              <h4>Your birth year:</h4>{" "}
            </label>
            <input
              id="user-birth-year"
              type="number"
              name="userBirthYear"
              value={formData.userBirthYear}
              onChange={handleChange}
              placeholder=""
              min="1900"
              max={new Date().getFullYear()} // Restrict to valid years
              required
            />
          </div>
        </div>

        <div className="divider"></div>
        <h2>Add Spouse</h2>
        <div>
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
            {/* <RetirementAgeForm
              prefix="spouse"
              handleChange={handleChange}
              formData={formData}
            /> */}
            <div>
              <label>
                {" "}
                <h4>Spouse's birth year:</h4>{" "}
              </label>
              <input
                type="number"
                name="spouseBirthYear"
                value={formData.spouseBirthYear}
                onChange={handleChange}
                placeholder=""
                min="1900"
                max={new Date().getFullYear()} // Restrict to valid years
                required
              />
            </div>
          </div>
        )}
      </form>

      <div className="divider"></div>
      <h2>Cash Investment</h2>
      <div>
        <label>
          <h4>Input Current Cash Investment (in $):</h4>
        </label>
        <div>
          <input
            type="number"
            step="0.01"
            min="0"
            name="value"
            value={cashData.value}
            onChange={handleCashChange}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="divider"></div>
      <h2>Investment Types and Investments</h2>
      <div>
        <button onClick={handleInvestmentType}>New Investment Type</button>
        {showInvestmentTypeForm && (
          <InvestmentType
            investmentTypes={investmentTypes}
            setInvestmentTypes={setInvestmentTypes}
            setShowInvestmentTypeForm={setShowInvestmentTypeForm}
          />
        )}
      </div>

      <div>
        <button onClick={handleInvestment}>New Investment</button>
        {showInvestmentForm && (
          <Investment
            investments={investments}
            setInvestments={setInvestments}
            setShowInvestmentForm={setShowInvestmentForm}
            investmentTypes={investmentTypes}
          />
        )}
      </div>
      <div>
        <ViewInvestmentDetails
          investments={investments}
          investmentTypes={investmentTypes}
        />
      </div>

      <div className="divider"></div>
      <h2>Event Series</h2>
      <p>
        {" "}
        Event series is a sequence of annual events. You may choose income,
        expense, invest, or rebalance events that will happen every year within
        a desired time range.
        <span
          data-tooltip-id="tooltip"
          data-tooltip-html={tooltipContent.eventSeries}
          className="info-icon"
        >
          ℹ️
        </span>
        <ReactTooltip id="tooltip" place="right" type="info" effect="solid" />
      </p>

      <div>
        <button onClick={handleCreateEvent}> Create Event </button>
        {showEventsForm && (
          <EventsForm
            events={events}
            setEvents={setEvents}
            setShowEventsForm={setShowEventsForm}
          />
        )}

        <ViewEventsDetails events={events} />
      </div>

      <div>
        <Strategy investments={investments} showEventsForm={showEventsForm} />
      </div>
    </div>
  );
});

export default ScenarioInfo;
