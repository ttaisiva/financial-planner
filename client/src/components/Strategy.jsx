import React, { useState } from "react";
import { useEffect } from "react";

const Strategy = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    optimizer: false,
    rmd: false,
  });

  return (
    <div>
      <h2>Spending Strategy</h2>

      <SpendingStrategy setFormData={setFormData} />
      <p> Enter Expense Withdrawal Strategy </p>
      <RothConversionSettings formData={formData} setFormData={setFormData} />
      <p> Optional Enter RMD Strategy </p>
    </div>
  );
};

export default Strategy;

// ordering on discretionary expenses
const SpendingStrategy = ({ setFormData }) => {
  const [expenses, setExpenses] = useState([]);

  // not possible yet ****
  // useEffect(() => {
  //   const fetchExpenses = async () => {
  //     try {
  //       const response = await fetch('http://localhost:3000/api/discretionary-expenses');
  //       const data = await response.json();
  //       setExpenses(data);
  //     } catch (error) {
  //       console.error('Error fetching discretionary expenses:', error);
  //     }
  //   };

  //   fetchExpenses();
  // }, []);

  return (
    <div>
      <p>Enter Spending Strategy</p>
      {/* TODO: Fetch existing discretionary expenses from server */}
      {/* Drag and drop mechanism? */}
    </div>
  );
};

// both roth and rmd are ordering on pre tax retirement accounts - share drag and drop component
const RothConversionSettings = ({ formData, setFormData }) => {
  const [accounts, setAccounts] = useState([]);

  const handleOptimizerToggle = () => {
    setFormData((prevData) => ({
      ...prevData,
      optimizer: !prevData.optimizer,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchPreTaxInvestments = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/pre-tax-investments');
        const data = await response.json();
        setAccounts(data);
        console.log('Pre-tax investments:', data);
      } catch (error) {
        console.error('Error fetching pre-tax investments:', error);
      }
    };
    fetchPreTaxInvestments();
  }, []);

  return (
    <>
      {/* Optimizer Settings */}
      <div>
        <div>
            <p> Roth Conversion Optimizer</p>
            <button type="button" onClick={handleOptimizerToggle}>
              {formData.optimizer ? "Disable Optimizer" : "Enable Optimizer"}
            </button>
          </div>
          {formData.optimizer && (
            <div>
              <div>
                <label>Start year:</label>
                <input
                  type="number"
                  name="RothStartYear"
                  placeholder="Enter year"
                  value={formData.RothStartYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>End year:</label>
                <input
                  type="number"
                  name="RothEndYear"
                  placeholder="Enter year"
                  value={formData.RothEndYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}
      </div>
      
      {/* Ordering Strategy */}
      <div>
        <p>Choose order of pre-tax retirement accounts below</p>
        {/* Drag and drop mechanism? */}
      </div>
      
    </>
  );
};

