import React, { useState, useEffect } from "react";
import { inputTypes, updateNestedState } from "../utils";

export const EventsForm = ({ events, setEvents, setShowEventsForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    start: {
      type: "",
      value: "",
      mean: "",
      stdDev: "",
      upper: "",
      lower: "",
      eventSeries: "",
      series_start: false,
      series_end: false,
    },
    changeAmtOrPct: "",
    changeDistribution: {
      type: "",
      value: "",
      mean: "",
      stdDev: "",
      upper: "",
      lower: "",
    },
    duration: {
      type: "",
      value: "",
      mean: "",
      stdDev: "",
      upper: "",
      lower: "",
    },
    initialAmount: null,
    maxCash: "",
    inflationAdjusted: false,
    userFraction: null,
    socialSecurity: false,
    glidePath: false,
    assetAllocation: "",
    allocationMethod: "",
    discretionary: false,
  });

  const [allocationPercentages, setAllocationPercentages] = useState({});

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      assetAllocation: allocationPercentages,
    }));
  }, [allocationPercentages]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    console.log("name", name);
    console.log("value", value);
    const parts = name.split(".");
    const parentKey = parts[0]; // inflation_assumption
    const childKey = parts[1]; // type
    console.log("parts", parts);

    if (parts.length > 1) {
      //meaning nested once
      updateNestedState(parentKey, childKey, value, setFormData);
    } else {
      //update everything else and checkbox
      const updated = setFormData((prevData) => ({
        ...prevData,
        [name]: type === "checkbox" ? checked : value,
      }));
      console.log("updated", formData);
      return updated;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("event submitted");
    console.log("first form data", formData);

    const { allocationMethod, ...rest } = formData;
    let glidePath = false;

    if (allocationMethod === "glide_path") glidePath = true;
    else glidePath = false;

    const eventData = {
      ...rest,
      assetAllocation: JSON.stringify(allocationPercentages),
      glidePath: glidePath,
    };

    console.log("final form data: ", eventData);

    try {
      console.log("Event Type: ", eventData.type);
      const response = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        console.log("Events saved successfully");
        const newEvent = await response.json();
        setEvents((prevEvents) => [...prevEvents, newEvent]);
        setShowEventsForm(false);
      } else {
        console.error("Failed to save events details");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setShowEventsForm(false); //hide form
  };

  const handleBack = () => {
    setShowEventsForm(false); // Go back
  };

  return (
    <div className="content">
      <form onSubmit={handleSubmit}>
        <h3>Customize your event:</h3> {/* I should add a delete btn*/}
        <div>
          <label>Name: </label>
          <input
            type="text"
            name="name"
            placeholder="Event name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Description: </label>
          <input
            type="text"
            name="description"
            placeholder="Describe your event..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Start year:</label>
          <select
            name="start.type"
            value={formData.start.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select start year
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
            <option value="series_start">Same year as event series</option>
            <option value="series_end">Year after event series</option>
          </select>

          {inputTypes({
            type: formData.start.type,
            formData,
            handleChange,
            prefix: "start",
          })}
        </div>
        <div>
          <label>Duration: </label>
          <select
            name="duration.type"
            value={formData.duration.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select Duration
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>

          {inputTypes({
            type: formData.duration.type,
            formData,
            handleChange,
            prefix: "duration",
          })}
        </div>
        <div>
          <label>Event Type </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select event type
            </option>
            <option value="income">Income</option>
            <option value="invest">Invest</option>
            <option value="rebalance">Rebalance</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        {formData.type === "income" && (
          <>
            <IncomeEvent formData={formData} handleChange={handleChange} />{" "}
            {/* pass as props */}
          </>
        )}
        {formData.type === "expense" && (
          <ExpenseEvent formData={formData} handleChange={handleChange} />
        )}
        {formData.type === "invest" && (
          <>
            <InvestEvent
              formData={formData}
              handleChange={handleChange}
              allocationPercentages={allocationPercentages}
              setAllocationPercentages={setAllocationPercentages}
            />{" "}
            {/* pass as props */}
          </>
        )}
        {formData.type === "rebalance" && (
          <>
            <RebalanceEvent
              formData={formData}
              handleChange={handleChange}
              allocationPercentages={allocationPercentages}
              setAllocationPercentages={setAllocationPercentages}
            />{" "}
            {/* pass as props */}
          </>
        )}
        <div>
          <button type="button" onClick={handleBack}>
            Back
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
};

const IncomeEvent = ({ formData, handleChange }) => {
  return (
    <>
      <div>
        <label>Initial Amount: $</label>
        <input
          type="number"
          name="initialAmount"
          min="0"
          placeholder="0.00"
          value={formData.initialAmount}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Expected Annual Change: </label>
        <select
          name="changeDistribution.type"
          value={formData.changeDistribution.type}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select expected annual change
          </option>
          <option value="fixed">Fixed</option>
          <option value="normal_distribution">Normal Distribution</option>
          <option value="uniform_distribution">Uniform Distribution</option>
        </select>
        <select
          name="changeAmtOrPct"
          value={formData.changeAmtOrPct}
          onChange={handleChange}
          required
        >
          <option value="amount">Amount</option>
          <option value="percent">Percentage</option>
        </select>

        {inputTypes({
          type: formData.changeDistribution.type,
          formData,
          handleChange,
          prefix: "changeDistribution",
        })}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="inflationAdjusted"
            checked={formData.inflationAdjusted}
            onChange={handleChange}
          />
          Inflation Adjusted
        </label>
      </div>

      <div>
        <label>User Percentage:</label>
        <input
          type="text"
          name="userFraction"
          value={formData.userFraction}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="socialSecurity"
            checked={formData.socialSecurity}
            onChange={handleChange}
          />
          Social Security
        </label>
      </div>
    </>
  );
};

const RebalanceEvent = ({
  formData,
  handleChange,
  allocationPercentages,
  setAllocationPercentages,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [sumWarning, setSumWarning] = useState("");
  const [taxStatus, setTaxStatus] = useState("");

  // Fetch investments not in pre-tax accounts
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const queryString = taxStatus ? `taxStatus=${taxStatus}` : "";
        const response = await fetch(
          `http://localhost:3000/api/get-investments?${queryString}`
        );

        if (!response.ok) {
          console.error("Failed to fetch investments:", response.status);
          return;
        }

        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
      }
    };

    if (!formData.changeDistribution) {
      fetchInvestments();
    }
  }, [taxStatus, formData.changeDistribution]);

  const handleTaxStatusChange = (e) => {
    setTaxStatus(e.target.value);
  };

  // Calculate sum of percentages for validation
  const validateAllocationSums = () => {
    let sum = 0;
    if (formData.allocationMethod === "fixed_percentage") {
      // if fixed
      sum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.start || 0),
        0
      );
    } else if (formData.allocationMethod === "glide_path") {
      // if glide path
      const startSum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.start || 0),
        0
      );
      const endSum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.end || 0),
        0
      );
      if (startSum !== 100 || endSum !== 100) {
        setSumWarning(
          `Start and end allocations must each sum to 100%. Start = ${startSum}%, End = ${endSum}%`
        );
        return;
      }
      sum = 100; // To pass the outer check
    }

    if (sum !== 100) {
      setSumWarning(`Allocation must sum to 100%. Currently: ${sum}%`);
    } else {
      setSumWarning("");
    }
  };

  useEffect(() => {
    validateAllocationSums();
  }, [allocationPercentages, formData.allocationMethod]);

  // Handlers
  const handleFixedPercentageChange = (investmentId, percentage) => {
    setAllocationPercentages((prev) => ({
      ...prev,
      [investmentId]: { start: parseFloat(percentage) } || 0,
    }));
  };

  const handleGlidePathChange = (investmentId, type, percentage) => {
    setAllocationPercentages((prev) => {
      const newAlloc = { ...prev };
      if (!newAlloc[investmentId])
        newAlloc[investmentId] = { start: 0, end: 0 };
      newAlloc[investmentId][type] = parseFloat(percentage) || 0;
      return newAlloc;
    });
  };

  return (
    <>
      <div>
        <div>
          <label>Tax Status: </label>
          <select
            name="tax_status"
            value={taxStatus}
            onChange={handleTaxStatusChange}
            required
          >
            <option value="" disabled>
              Select Tax Status
            </option>
            <option value="Pre-Tax">Pre Tax</option>
            <option value="Non-Retirement">Non Retirement</option>
            <option value="After-Tax">After Tax</option>
          </select>
        </div>
        <label>Choose method to allocate funds to investments:</label>
        <input
          type="radio"
          name="allocationMethod"
          value="fixed_percentage"
          checked={formData.allocationMethod === "fixed_percentage"}
          onChange={handleChange}
        />
        Fixed percentage
        <input
          type="radio"
          name="allocationMethod"
          value="glide_path"
          checked={formData.allocationMethod === "glide_path"}
          onChange={handleChange}
        />
        Glide path
      </div>

      {sumWarning && (
        <div style={{ color: "red", fontWeight: "bold" }}>{sumWarning}</div>
      )}

      {formData.allocationMethod === "fixed_percentage" && (
        <div>
          <label>Fixed percentage allocations (must sum to 100%):</label>
          {accounts.map((account) => (
            <div key={account.id}>
              <label>
                {account.investment_type} (${account.value}):
              </label>
              <input
                type="number"
                value={allocationPercentages[account.id]?.start || ""}
                onChange={(e) =>
                  handleFixedPercentageChange(account.id, e.target.value)
                }
                min={0}
                required
              />
              <span>%</span>
            </div>
          ))}
        </div>
      )}

      {formData.allocationMethod === "glide_path" && (
        <div>
          <label>
            Glide Path Allocations (start and end must each sum to 100%):
          </label>
          {accounts.map((account) => (
            <div key={account.id}>
              <label>
                {account.investmentType} (${account.value}):
              </label>
              <div>
                <label>Start:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.start || ""}
                  onChange={(e) =>
                    handleGlidePathChange(account.id, "start", e.target.value)
                  }
                  min={0}
                  required
                />
                <span>%</span>
              </div>
              <div>
                <label>End:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.end || ""}
                  onChange={(e) =>
                    handleGlidePathChange(account.id, "end", e.target.value)
                  }
                  min={0}
                  required
                />
                <span>%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const InvestEvent = ({
  formData,
  handleChange,
  allocationPercentages,
  setAllocationPercentages,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [sumWarning, setSumWarning] = useState("");
  console.log("in invest event");

  // Fetch investments not in pre-tax accounts
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const taxStatus = ["after-tax", "non-retirement"];
        const queryString = taxStatus
          .map((status) => `taxStatus=${status}`)
          .join("&");
        const response = await fetch(
          `http://localhost:3000/api/get-investments?${queryString}`
        );

        if (!response.ok) {
          console.error("Failed to fetch investments:", response.status);
          return;
        }

        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error("Error fetching investments:", error);
      }
    };

    if (
      formData.allocationMethod === "fixed_percentage" ||
      formData.allocationMethod === "glide_path"
    ) {
      fetchInvestments();
    }
  }, [formData.allocationMethod]);

  // Calculate sum of percentages for validation
  const validateAllocationSums = () => {
    let sum = 0;
    if (formData.allocationMethod === "fixed_percentage") {
      sum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.start || 0),
        0
      );
    } else if (formData.allocationMethod === "glide_path") {
      const startSum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.start || 0),
        0
      );
      const endSum = Object.values(allocationPercentages).reduce(
        (acc, val) => acc + parseFloat(val?.end || 0),
        0
      );
      if (startSum !== 100 || endSum !== 100) {
        setSumWarning(
          `Start and end allocations must each sum to 100%. Start = ${startSum}%, End = ${endSum}%`
        );
        return;
      }
      sum = 100; // To pass the outer check
    }

    if (sum !== 100) {
      setSumWarning(`Allocation must sum to 100%. Currently: ${sum}%`);
    } else {
      setSumWarning("");
    }
  };

  useEffect(() => {
    validateAllocationSums();
  }, [allocationPercentages, formData.allocationMethod]);

  // Handlers
  const handleFixedPercentageChange = (investmentId, percentage) => {
    setAllocationPercentages((prev) => ({
      ...prev,
      [investmentId]: { start: parseFloat(percentage) || 0 },
    }));
  };

  const handleGlidePathChange = (investmentId, type, percentage) => {
    setAllocationPercentages((prev) => {
      const newAlloc = { ...prev };
      if (!newAlloc[investmentId])
        newAlloc[investmentId] = { start: 0, end: 0 };
      newAlloc[investmentId][type] = parseFloat(percentage) || 0;
      return newAlloc;
    });
  };

  return (
    <>
      <div>
        <label>Choose method to allocate funds to investments:</label>
        <input
          type="radio"
          name="allocationMethod"
          value="fixed_percentage"
          checked={formData.allocationMethod === "fixed_percentage"}
          onChange={handleChange}
        />
        Fixed percentage
        <input
          type="radio"
          name="allocationMethod"
          value="glide_path"
          checked={formData.allocationMethod === "glide_path"}
          onChange={handleChange}
        />
        Glide path
      </div>

      <div>
        <label>Maximum Cash to Hold at Year-End:</label>
        <input
          type="number"
          name="maxCash"
          value={formData.maxCash}
          onChange={handleChange}
          min={0}
        />
      </div>

      {sumWarning && (
        <div style={{ color: "red", fontWeight: "bold" }}>{sumWarning}</div>
      )}

      {formData.allocationMethod === "fixed_percentage" && (
        <div>
          <label>Fixed percentage allocations (must sum to 100%):</label>
          {accounts.map((account) => (
            <div key={account.id}>
              <label>
                {account.investmentType} (${account.value}):
              </label>
              <input
                type="number"
                value={allocationPercentages[account.id]?.start || ""}
                onChange={(e) =>
                  handleFixedPercentageChange(account.id, e.target.value)
                }
                min={0}
                required
              />
              <span>%</span>
            </div>
          ))}
        </div>
      )}

      {formData.allocationMethod === "glide_path" && (
        <div>
          <label>
            Glide Path Allocations (start and end must each sum to 100%):
          </label>
          {accounts.map((account) => (
            <div key={account.id}>
              <label>
                {account.investmentType} (${account.value}):
              </label>
              <div>
                <label>Start:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.start || ""}
                  onChange={(e) =>
                    handleGlidePathChange(account.id, "start", e.target.value)
                  }
                  min={0}
                  required
                />
                <span>%</span>
              </div>
              <div>
                <label>End:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.end || ""}
                  onChange={(e) =>
                    handleGlidePathChange(account.id, "end", e.target.value)
                  }
                  min={0}
                  required
                />
                <span>%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const ExpenseEvent = ({ formData, handleChange }) => {
  return (
    <>
      <div>
        <label>Initial Amount: $</label>
        <input
          type="number"
          name="initialAmount"
          min="0"
          placeholder="0.00"
          value={formData.initialAmount}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Expected Annual Change: </label>
        <select
          name="changeDistribution.type"
          value={formData.changeDistribution.type}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select expected annual change
          </option>
          <option value="fixed">Fixed</option>
          <option value="normal_distribution">Normal Distribution</option>
          <option value="uniform_distribution">Uniform Distribution</option>
        </select>
        <select
          name="changeAmtOrPct"
          value={formData.changeDistribution.amtOrPct}
          onChange={handleChange}
          required
        >
          <option value="amount">Amount</option>
          <option value="percent">Percentage</option>
        </select>

        {inputTypes({
          type: formData.changeDistribution.type,
          formData,
          handleChange,
          prefix: "changeDistribution",
        })}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="inflationAdjusted"
            checked={formData.inflationAdjusted}
            onChange={handleChange}
          />
          Inflation Adjusted
        </label>
      </div>

      <div>
        <label>User Percentage:</label>
        <input
          type="text"
          name="userFraction"
          value={formData.userFraction}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Discretionary</label>
        <input
          type="checkbox"
          name="discretionary"
          value={formData.discretionary || ""}
          onChange={handleChange}
        />
      </div>
    </>
  );
};

export const ViewEventsDetails = ({ events }) => {
  useEffect(() => {
    console.log("events", events);
  }, [events]);

  return (
    <div className="p-4 border rounded-md mt-6">
      <h3>Your Events</h3>
      {events.length > 0 ? (
        <ul>
          {events.map((item, idx) => (
            <li key={idx} className="item">
              <strong>{item.name}</strong>: {item.description}, Type:{" "}
              {item.type}
              {/* need to edit this */}
              {/* {item.start?.value && (
                <span>, Start: {item.start.type} ({item.start.value})</span>
              )}
              {item.duration?.value && (
                <span>, Duration: {item.duration.type} ({item.duration.value})</span>
              )} */}
              {item.type === "income" && (
                <>
                  <br />
                  Initial Amount: ${item.initialAmount}
                  <br />
                  Expected Annual Change: {item.changeDistribution?.type}{" "}
                  {item.changeAmtOrPct && `(${item.changeAmtOrPct})`}
                  <br />
                  User %: {item.userFraction}
                  <br />
                  {item.socialSecurity && <span>Social Security: ✅</span>}
                  <br />
                  {item.inflationAdjusted && (
                    <span>Inflation Adjusted: ✅</span>
                  )}
                </>
              )}
              {item.type === "expense" && (
                <>
                  <br />
                  Initial Amount: ${item.initialAmount}
                  <br />
                  Expected Annual Change: {item.changeDistribution?.type}{" "}
                  {item.changeAmtOrPct && `(${item.changeAmtOrPct})`}
                  <br />
                  User %: {item.userFraction}
                  <br />
                  Spouse %: {item.spousePercentage}
                  <br />
                  {item.discretionary && <span>Discretionary: ✅</span>}
                  <br />
                  {item.inflationAdjusted && (
                    <span>Inflation Adjusted: ✅</span>
                  )}
                </>
              )}
              {item.type === "invest" && (
                <>
                  <br />
                  Allocation method: {item.allocationMethod}
                  <br />
                  Max Cash: ${item.maxCash}
                </>
              )}
              {item.type === "rebalance" && (
                <>
                  <br />
                  Allocation method: ${item.allocationMethod}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events added yet.</p>
      )}
    </div>
  );
};
