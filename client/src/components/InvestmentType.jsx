import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


//TODO: send stuff to database, validate inputs, fix expense ratio, view, edit
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

  const navigate = useNavigate()
  const handleChange = (e) => {
    // check if inputs are valid 

    if (e.target.name === "returnValue" && formData.returnValueType === "percentage") {
        {/*need to have some kind of percentage flag or so , where exactly to do error testing  */}
        if (e.target.value < 0 || e.target.value > 1) {
            window.alert("Please enter a valid input"); //not working for some reason
            return; 
        }
    }


    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Investment Type Submitted:", formData); 
    //need to send stuff to database
    
    navigate("/NewScenarioPage") //close form
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
            <option value="fixed">Fixed </option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="gbm">Geometric Brownian Motion</option>
          </select>
          < select>
            <option value="percentage"> Amount </option>
            <option value="percentage"> Percentage </option>
          </select>
          <input type="text" name="returnValue" placeholder="Enter value or %" value={formData.returnValue} onChange={handleChange} required />
        </div> 

        
        <div>
          <label>Expense Ratio Percentage :</label>
          <input type="text" name="expenseRatio" value={formData.expenseRatio} onChange={handleChange} required />
        </div>

        {/* Expected Annual Income */}
        <div>
          <label>Expected Annual Income:</label>
          <select name="incomeType" value={formData.incomeType} onChange={handleChange}>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
            <option value="gbm">Geometric Brownian Motion</option>
          </select>
          < select>
            <option value="percentage"> Amount </option>
            <option value="percentage"> Percentage </option>
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


