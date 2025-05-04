import React, { useState, useEffect } from "react";
import { inputTypes, updateNestedState } from "../utils";

export const Investment = ({
  investments,
  setInvestments,
  setShowInvestmentForm,
  investmentTypes,
}) => {
  const [formData, setFormData] = useState({
    id: "",
    investmentType: "",
    value: "",
    taxStatus: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === "value" ? parseFloat(value) : value;

    const updatedFormData = {
      ...formData,
      [name]: updatedValue,
    };

    // Set ID if both fields are available
    if (name === "investmentType" || name === "taxStatus") {
      const { investmentType, taxStatus } = {
        ...formData,
        [name]: updatedValue,
      };
      if (investmentType && taxStatus) {
        updatedFormData.id = `${investmentType} ${taxStatus}`;
      }
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Investment Submitted:", formData);
    // send to server

    try {
      const response = await fetch("http://localhost:3000/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("Investment saved successfully");
        const newInvestment = await response.json(); // ERROR HERE
        setInvestments((prev) => [...prev, newInvestment]);

        console.log("New investment: ", newInvestment);

        setShowInvestmentForm(false);
      } else {
        setInvestments((prev) => [...prev, formData]);
        console.error("Failed to save investment");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setShowInvestmentForm(false);
  };

  const handleBack = () => {
    setShowInvestmentForm(false); // Go back
  };

  return (
    <div>
      <h3>Create an Investment</h3>

      <form onSubmit={handleSubmit}>
        {/* Investment Type */}
        {/* TODO: choose from existing investment types created by user instead of text field */}
        <div>
          <label>Investment Type: </label>
          {investmentTypes.length === 0 ? (
            <select disabled>
              <option>No investment types created</option>
            </select>
          ) : (
            <select
              name="investmentType"
              value={formData.investmentType}
              onChange={handleChange}
              required
            >
              <option value="">Select investment type</option>
              {investmentTypes.map((typeObj, index) => (
                <option key={index} value={typeObj.name}>
                  {typeObj.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Dollar Amount */}
        <div>
          <label>Dollar Amount: $</label>
          <input
            type="number"
            name="value"
            min="0"
            placeholder="0.00"
            value={formData.value}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tax Status */}
        <div>
          <label>Taxability: </label>
          <select
            name="taxStatus"
            value={formData.taxStatus}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select Tax Status
            </option>
            <option value="pre-tax">Pre Tax</option>
            <option value="non-retirement">Non Retirement</option>
            <option value="after-tax">After Tax</option>
          </select>
        </div>
        <button type="button" onClick={handleBack}>
          Back
        </button>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

//TODO: send stuff to database, validate inputs, fix expense ratio, view, edit
export const InvestmentType = ({
  investmentTypes,
  setInvestmentTypes,
  setShowInvestmentTypeForm,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    returnAmtOrPct: "", // new
    returnDistribution: {
      type: "",
      value: "",
      stdev: "",
      mean: "",
    },
    expenseRatio: "",
    incomeAmtOrPct: "", // new
    incomeDistribution: {
      type: "",
      value: "",
      stdev: "",
      mean: "",
    },
    taxability: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "taxability") {
      updatedValue = parseInt(value, 10); // converts "0" or "1" to 0 or 1
    }

    const parts = name.split(".");
    const parentKey = parts[0];
    const childKey = parts[1];

    if (parts.length > 1) {
      //meaning nested once
      updateNestedState(parentKey, childKey, value, setFormData);
    } else {
      setFormData({ ...formData, [name]: updatedValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Investment Type Submitted:", formData);

    try {
      const response = await fetch(
        "http://localhost:3000/api/investment-type",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        console.log("Investment type saved successfully");
        const newType = await response.json();
        setInvestmentTypes((prev) => [...prev, newType]); //add new investmenttype to list
        setShowInvestmentTypeForm(false);
      } else {
        console.error("Failed to save investment type");
      }
    } catch (error) {
      console.error("Error:", error);
      setInvestmentTypes((prev) => [...prev, formData]);
    }

    setShowInvestmentTypeForm(false);
  };

  const handleBack = () => {
    setShowInvestmentTypeForm(false);
  };

  return (
    <div>
      <h3>Create a New Investment Type</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            name="name"
            placeholder="Investment name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Description: </label>
          <textarea
            name="description"
            placeholder="Describe your investment..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Expected Annual Return Value Type: </label>
          <select
            name="returnAmtOrPct"
            value={formData.returnAmtOrPct}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select return type
            </option>
            <option value="amount">$ Amount</option>
            <option value="percent">% Percentage</option>
          </select>
        </div>

        <div>
          <label>Expected Annual Return: </label>
          <select
            name="returnDistribution.type"
            value={formData.returnDistribution.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select expected annual return
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal">Normal Distribution</option>
          </select>

          {inputTypes({
            type: formData.returnDistribution.type,
            formData,
            handleChange,
            prefix: "returnDistribution",
          })}
        </div>

        {/* Expense Ratio */}
        <div>
          <label>Expense Ratio Percentage: </label>
          <input
            type="number"
            name="expenseRatio"
            value={formData.expenseRatio}
            min="0"
            max="100"
            placeholder="0%"
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Expected Annual Income Value Type: </label>
          <select
            name="incomeAmtOrPct"
            value={formData.incomeAmtOrPct}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select income type
            </option>
            <option value="amount">$ Amount</option>
            <option value="percent">% Percentage</option>
          </select>
        </div>

        {/* Expected Annual Income - Only shows if "fixed" is selected */}
        <div>
          <label>Expected Annual Income: </label>
          <select
            name="incomeDistribution.type"
            value={formData.incomeDistribution.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select expected annual income
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal">Normal Distribution</option>
          </select>

          {inputTypes({
            type: formData.incomeDistribution.type,
            formData,
            handleChange,
            prefix: "incomeDistribution",
          })}
        </div>

        {/* Taxability */}
        <div>
          <label>Taxability: </label>
          <select
            name="taxability"
            value={formData.taxability}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select taxability
            </option>
            <option value="1">Taxable</option>
            <option value="0">Tax-Exempt</option>
          </select>
        </div>

        <button type="button" onClick={handleBack}>
          Back
        </button>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export const ViewInvestmentDetails = ({ investments, investmentTypes }) => {
  useEffect(() => {
    console.log("investments", investments);
    console.log("investmentTypes", investmentTypes);
  }, [investments, investmentTypes]);

  let returnPrefix = "!";

  return (
    <div className="p-4 border rounded-md mt-6">
      <h3>Your Investment Types</h3>
      {investmentTypes.length > 0 ? (
        <ul>
          {investmentTypes.map((item, idx) => {
            const returnPrefix = item.returnAmtOrPct === "amount" ? "$" : "%";
            const incomePrefix = item.incomeAmtOrPct === "amount" ? "$" : "%";

            return (
              <li key={idx} className="item">
                <strong>{item.name}</strong>: {item.description}, Expected
                Annual Return:{" "}
                {item.returnDistribution.type === "fixed"
                  ? `${returnPrefix}${item.returnDistribution.value}`
                  : `Mean: ${item.returnDistribution.mean}${returnPrefix}, Std Dev: ${item.returnDistribution.stdev}${returnPrefix}`}
                , Expense Ratio: {item.expenseRatio}%, Expected Annual Income:{" "}
                {item.incomeDistribution.type === "fixed"
                  ? `${incomePrefix}${item.incomeDistribution.value}`
                  : `Mean: ${item.incomeDistribution.mean}${incomePrefix}, Std Dev: ${item.incomeDistribution.stdev}${incomePrefix}`}
                , Taxability: {item.taxability === 1 ? "Taxable" : "Tax-exempt"}
              </li>
            );
          })}
        </ul>
      ) : null}

      <h3>Your Investments</h3>
      {investments.length > 0 ? (
        <ul>
          {investments.map((item, idx) => (
            <li key={idx} className="item">
              <strong>{item.investmentType}</strong>: ${item.value} (
              {item.taxStatus})
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
