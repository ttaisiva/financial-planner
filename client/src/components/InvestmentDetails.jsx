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

  const handleSubmit =  async (e) => {
    e.preventDefault();
    console.log("Investment Submitted:", formData);
    // send to server
    
    try {
      const response = await fetch('http://localhost:8000/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Investment saved successfully');
        setShowInvestmentForm(false);
      } else {
        console.error('Failed to save investment');
      }
    } catch (error) {
      console.error('Error:', error);
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
            name="investment_type"
            value={formData.investment_type}
            onChange={handleChange}
            required
          />
        </div>

        {/* Dollar Amount */}
        <div>
          <label>Dollar Amount: $</label>
          <input
            type="number"
            name="dollar_value"
            min = "0"
            placeholder = "0.00"
            value={formData.dollar_value}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tax Status */}
        <div>
          <label>Taxability: </label>
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
export const InvestmentType = ({ setShowInvestmentTypeForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expAnnReturnType: "fixed",
    expAnnReturnValue: "",
    expenseRatio: "",
    expAnnIncomeType: "fixed",
    expAnnIncomeValue: "",
    taxability: "taxable",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    // Reset values when switching from "fixed" to another type
    if (name === "expAnnReturnType" && value !== "fixed") {
      setFormData((prev) => ({ ...prev, expAnnReturnValue: "" }));
    }
    if (name === "expAnnIncomeType" && value !== "fixed") {
      setFormData((prev) => ({ ...prev, expAnnIncomeValue: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Investment Type Submitted:", formData);

    const jwtToken = localStorage.getItem('jwtToken');  //local storage for now but we can also do session

    try {
      const response = await fetch('http://localhost:8000/api/investment-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Investment type saved successfully');
        setShowInvestmentForm(false);
      } else {
        console.error('Failed to save investment type');
      }
    } catch (error) {
      console.error('Error:', error);
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
          <input type="text" name="name" placeholder="Investment name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <label>Description: </label>
          <textarea name="description" placeholder="Describe your investment..." value={formData.description} onChange={handleChange} required />
        </div>

        
        <div>
          <label>Expected Annual Return Type: </label>
          <select name="expAnnReturnType" value={formData.expAnnReturnType} onChange={handleChange}>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
          </select>
          {formData.expAnnReturnType === 'fixed' && (
            <input type="number" name="expAnnReturnValue" placeholder="0.00" value={formData.expAnnReturnValue} onChange={handleChange} required />
          )}
        </div>


        {/* Expense Ratio */}
        <div>
          <label>Expense Ratio Percentage: </label>
          <input type="number" name="expenseRatio" value={formData.expenseRatio} min="0" max="100" placeholder="0%" onChange={handleChange} required />
        </div>

        {/* Expected Annual Income - Only shows if "fixed" is selected */}
        <div>
          <label>Expected Annual Income Type: </label>
          <select name="expAnnIncomeType" value={formData.expAnnIncomeType} onChange={handleChange}>
            <option value="fixed">Fixed</option>
            <option value="normal_distribution">Normal Distribution</option>
          </select>
          {formData.expAnnIncomeType === 'fixed' && (
            <input type="number" name="expAnnIncomeValue" placeholder="0.00" value={formData.expAnnIncomeValue} onChange={handleChange} required />
          )}
          
        </div>

        {/* Taxability */}
        <div>
          <label>Taxability: </label>
          <select name="taxability" value={formData.taxability} onChange={handleChange}>
            <option value="taxable">Taxable</option>
            <option value="tax-exempt">Tax-Exempt</option>
          </select>
        </div>

        <button type="button" onClick={handleBack}>Back</button>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};