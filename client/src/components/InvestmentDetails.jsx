import React, { useState, useEffect } from "react";
import { inputTypes, updateNestedState } from "../utils";

export const Investment = ({
  investments,
  setInvestments,
  setShowInvestmentForm,
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
          <input
            type="text"
            name="investmentType"
            value={formData.investmentType}
            onChange={handleChange}
            required
          />
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
    expAnnReturn: {
      type: "",
      value: "",
      stdev: "",
      mean: "",
      amtOrPct: "",
    },
    expenseRatio: "",
    expAnnIncome: {
      type: "",
      value: "",
      stdev: "",
      mean: "",
      amtOrPct: "",
    },
    taxability: "",
  });

  // const resetValues = (type, value) => {
  //   if (type === "expAnnReturnType") {
  //     if (value === "fixed") {
  //       setFormData((prev) => ({
  //         ...prev,
  //         expAnnReturnMean: "",
  //         expAnnReturnStdDev: "",
  //       }));
  //     } else if (value === "normal_distribution") {
  //       setFormData((prev) => ({
  //         ...prev,
  //         expAnnReturnValue: "",
  //       }));
  //     }
  //   } else if (type === "expAnnIncomeType") {
  //     if (value === "fixed") {
  //       setFormData((prev) => ({
  //         ...prev,
  //         expAnnIncomeMean: "",
  //         expAnnIncomeStdDev: "",
  //       }));
  //     } else if (value === "normal_distribution") {
  //       setFormData((prev) => ({
  //         ...prev,
  //         expAnnIncomeValue: "",
  //       }));
  //     }
  //   }
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const parts = name.split(".");
    const parentKey = parts[0];
    const childKey = parts[1];

    if (parts.length > 1) {
      //meaning nested once
      updateNestedState(parentKey, childKey, value, setFormData);
    } else {
      setFormData({ ...formData, [name]: value });
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
          <label>Expected Annual Return: </label>
          <select
            name="expAnnReturn.type"
            value={formData.expAnnReturn.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select expected annual return
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
          </select>
          <select
            name="expAnnReturn.amtOrPct"
            value={formData.expAnnReturn.amtOrPct}
            onChange={handleChange}
            required
          >
            <option value="amt">Amount</option>
            <option value="pct">Percentage</option>
          </select>

          {inputTypes({
            type: formData.expAnnReturn.type,
            formData,
            handleChange,
            prefix: "expAnnReturn",
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

        {/* Expected Annual Income - Only shows if "fixed" is selected */}
        <div>
          <label>Expected Annual Income: </label>
          <select
            name="expAnnIncome.type"
            value={formData.expAnnIncome.type}
            onChange={handleChange}
          >
            <option value="" disabled>
              Select expected annual income
            </option>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
          </select>
          <select
            name="expAnnIncome.amtOrPct"
            value={formData.expAnnIncome.amtOrPct}
            onChange={handleChange}
            required
          >
            <option value="amt">Amount</option>
            <option value="pct">Percentage</option>
          </select>

          {inputTypes({
            type: formData.expAnnIncome.type,
            formData,
            handleChange,
            prefix: "expAnnIncome",
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
            <option value="taxable">Taxable</option>
            <option value="tax-exempt">Tax-Exempt</option>
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

  return (
    <div className="p-4 border rounded-md mt-6">
      <h3>Your Investment Types</h3>
      {investmentTypes.length > 0 ? (
        <ul>
          {investmentTypes.map((item, idx) => (
            <li key={idx} className="item">
              <strong>{item.name}</strong>: {item.description}, Expected Annual
              Return:{" "}
              {item.expAnnReturn.type === "fixed"
                ? `$${item.expAnnReturn.value}`
                : `Mean: ${item.expAnnReturn.mean}, Std Dev: ${item.expAnnReturn.stdev}`}
              , Expense Ratio: {item.expenseRatio}%, Expected Annual Income:{" "}
              {item.expAnnIncome.type === "fixed"
                ? `$${item.expAnnIncome.value}`
                : `Mean: ${item.expAnnIncome.mean}, Std Dev: ${item.expAnnIncome.stdev}`}
              , Taxability: {item.taxability}
            </li>
          ))}
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
