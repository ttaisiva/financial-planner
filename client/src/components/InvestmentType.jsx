import React, { useState } from "react";
import { Link } from "react-router-dom";

const InvestmentType = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    returnType: "fixed",
    returnValue: "",
    expenseRatio: "",
    incomeType: "fixed",
    incomeValue: "",
    taxability: "taxable",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Investment Type Submitted:", formData);
  };

  return (
    <div>
      <h2>Create a New Investment Type</h2>
      <Link to="/NewScenarioPage">
          <button>Back</button>
        </Link>
    
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required />
        </div>

        {/*expected annual return*/ }
        <div>
          <label>Expected Annual Return:</label>
          <select name="returnType" value={formData.returnType} onChange={handleChange}>
            <option value="fixed">Fixed </option> {/* if fixed the user needs to provide it? has option for number and percentage */}
            <option value="normal_distribution">Normal Distribution</option>
            <option value="gbm">Geometric Brownian Motion</option>
          </select>
          <input type="text" name="returnValue" placeholder="Enter value or %" value={formData.returnValue} onChange={handleChange} required />
        </div>

        {/* Expense Ratio */}
        <div>
          <label>Expense Ratio (%):</label>
          <input type="number" step="0.01" name="expenseRatio" value={formData.expenseRatio} onChange={handleChange} required />
        </div>

        {/* Expected Annual Income */}
        <div>
          <label>Expected Annual Income:</label>
          <select name="incomeType" value={formData.incomeType} onChange={handleChange}>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
            <option value="gbm">Geometric Brownian Motion</option>
          </select>
          <input type="text" name="incomeValue" placeholder="Enter value or %" value={formData.incomeValue} onChange={handleChange} required />
        </div>

        {/* Taxability */}
        <div>
          <label>Taxability:</label>
          <select name="taxability" value={formData.taxability} onChange={handleChange}>
            <option value="taxable">Taxable</option>
            <option value="tax-exempt">Tax-Exempt</option>
          </select>
        </div>

        {/* need to send to server -> on submit should return to new scenario page */}
        <button type="submit">Save</button>
      </form> 
     
    </div>
  );
};

export default InvestmentType;


