import React, { useState, useEffect } from "react";


export const Investment = ( { investments, setInvestments, setShowInvestmentForm } ) => {
  const [formData, setFormData] = useState({
    investment_type: "",
    dollar_value: "",
    tax_status: "Pre_Tax",
  });



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "dollar_value" ? parseFloat(value) : value,
    });
  };

  const handleSubmit =  async (e) => {
    e.preventDefault();
    console.log("Investment Submitted:", formData);
    // send to server
    
    try {
      const response = await fetch('http://localhost:3000/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Investment saved successfully');
        const newInvestment = await response.json(); // ERROR HERE
        setInvestments((prev) => [...prev, newInvestment]);

        console.log("New investment: " ,newInvestment);
      
        setShowInvestmentForm(false);
      } else {
        setInvestments((prev) => [...prev, formData]);
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
export const InvestmentType = ({ investmentTypes, setInvestmentTypes , setShowInvestmentTypeForm }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expAnnReturnType: "fixed",
    expAnnReturnValue: "",
    expAnnReturnStdDev: "",
    expAnnReturnMean: "",
    expenseRatio: "",
    expAnnIncomeType: "fixed",
    expAnnIncomeValue: "",
    expAnnIncomeStdDev: "",
    expAnnIncomeMean: "",
    taxability: "taxable",
  });

  
  const resetValues = (type, value) => {
    if (type === "expAnnReturnType") {
      if (value === "fixed") {
        setFormData((prev) => ({
          ...prev,
          expAnnReturnMean: "",
          expAnnReturnStdDev: "",
        }));
      } else if (value === "normal_distribution") {
        setFormData((prev) => ({
          ...prev,
          expAnnReturnValue: "",
        }));
      }
    } else if (type === "expAnnIncomeType") {
      if (value === "fixed") {
        setFormData((prev) => ({
          ...prev,
          expAnnIncomeMean: "",
          expAnnIncomeStdDev: "",
        }));
      } else if (value === "normal_distribution") {
        setFormData((prev) => ({
          ...prev,
          expAnnIncomeValue: "",
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });


    if (name === "expAnnReturnType" || name === "expAnnIncomeType") {
      resetValues(name, value);
    }


  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Investment Type Submitted:", formData);

    

    try {
      const response = await fetch('http://localhost:3000/api/investment-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Investment type saved successfully');
        const newType = await response.json();
        setInvestmentTypes((prev) => [...prev, newType]); //add new investmenttype to list
        setShowInvestmentTypeForm(false);
      } else {
        console.error('Failed to save investment type');
      }
    } catch (error) {
      console.error('Error:', error);
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
        
          {formData.expAnnReturnType === "fixed" ? (
              <input type="number" min = "0" name="expAnnReturnValue" placeholder="0.0" value={formData.expAnnReturnValue} onChange={handleChange} required />
              ) : formData.expAnnReturnType === "normal_distribution" ? (
              <>
                <input type="number" min = "0" name= "expAnnReturnMean" placeholder="Enter mean" value={formData.expAnnReturnMean} onChange={handleChange} required />
                <input type="number" min = "0" name= "expAnnReturnStdDev" placeholder="Enter standard deviation" value={formData.expAnnReturnStdDev} onChange={handleChange} required />
              </>
            ) : null}

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
          {formData.expAnnIncomeType === "fixed" ? (
              <input type="number" min = "0" name="expAnnIncomeValue" placeholder="0.0" value={formData.expAnnIncomeValue} onChange={handleChange} required />
              ) : formData.expAnnIncomeType === "normal_distribution" ? (
              <>
                <input type="number" min = "0" name= "expAnnIncomeMean" placeholder="Enter mean" value={formData.expAnnIncomeMean} onChange={handleChange} required />
                <input type="number" min = "0" name= "expAnnIncomeStdDev" placeholder="Enter standard deviation" value={formData.expAnnIncomeStdDev} onChange={handleChange} required />
              </>
            ) : null}
          
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



export const ViewInvestmentDetails = ({ investments, investmentTypes }) => {

  console.log("investments", investments);
  console.log("investmentTypes", investmentTypes);
  return (
    <div className="p-4 border rounded-md mt-6">
      <h3> Your Investment Types</h3>
      {investmentTypes.length > 0 ? (
        <ul >
          {investmentTypes.map((item, idx) => (
            <ul key={idx}>
              <strong>{item.name} </strong>: 
               {item.description}, Expected Annual Return: {item.expAnnReturnType === "fixed" ? `$${item.expAnnReturnValue}` : `Mean: ${item.expAnnReturnMean}, Std Dev: ${item.expAnnReturnStdDev}`}
               , Expense Ratio: {item.expenseRatio}%
              , Expected Annual Income: {item.expAnnIncomeType === "fixed" ? `$${item.expAnnIncomeValue}` : `Mean: ${item.expAnnIncomeMean}, Std Dev: ${item.expAnnIncomeStdDev}`}  
                , Taxability: {item.taxability} 

            </ul>
          ))}
        </ul>
      ) : (
        null
      )}

      <h3> Your Investments </h3> 
      {investments.length > 0 ? (
        <ul >
          
          {investments.map((item, idx) => (
            <ul key={idx}>
              <strong>{item.investment_type}</strong>: ${item.dollar_value}, ({item.tax_status})
            </ul>
          ))}
        </ul>
      ) : (
        null
      )}
    </div>
  );
};



