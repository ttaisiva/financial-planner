import React, { useState } from "react";


export const Investment = ( { setShowInvestmentForm } ) => {
  const [formData, setFormData] = useState({
    investment_type: "",
    dollar_value: "",
    tax_status: "Pre_Tax",
  });



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Investment Submitted:", formData);
    // send to server
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
        <div>
          <label>Investment Type:</label>
          <input
            type="text"
            name="investment_type"
            value={formData.investment_type}
            onChange={handleChange}
            required
          />
        </div>

        {/* Dollar Amount */}
        <div>
          <label>Dollar Amount:</label>
          <input
            type="text"
            name="dollar_value"
            value={formData.dollar_value}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tax Status */}
        <div>
          <label>Taxability:</label>
          <select
            name="tax_status"
            value={formData.tax_status}
            onChange={handleChange}
          >
            <option value="Pre_Tax">Pre Tax</option>
            <option value="Non_Retirement">Non Retirement</option>
            <option value="After_Tax">After Tax</option>
          </select>
        </div>
        <button type="button" onClick={handleBack}>Back</button>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};







//TODO: send stuff to database, validate inputs, fix expense ratio, view, edit
export const InvestmentType = ( { setShowInvestmentTypeForm }  ) => {
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
    
    setShowInvestmentTypeForm(false);
  };

  const handleBack = () => {
    setShowInvestmentTypeForm(false); // Go back
  };

  return (
    <div>
      <h3>Create a New Investment Type</h3>

    
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
        <button type="button" onClick={handleBack}>Back</button>
        <button type="submit">Save</button>
      </form> 
     
    </div>
  );
};






