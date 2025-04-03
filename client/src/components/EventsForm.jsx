import React, { useState, useEffect } from 'react';
import { inputTypes } from '../utils';

const EventsForm = ({ setShowEventsForm }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startType: '',
    startValue: '',
    startMean: '',
    startStdDev: '',
    startupper: '',
    startlower: '',
    durationType: '',
    durationValue: '',
    eventType: '',
    eventValue: '',
    initialAmount: '', 
    annualChangeType: '',
    annualChangeValue: '',
    inflationAdjusted: false,
    userPercentage: '',
    spousePercentage: '',
    isSocialSecurity: false,
    isWages: false,
    allocationMethod: '',
    discretionary: false, 
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));


    // if (name === "startType" || name === "durationType") {
    //   const prefix = name === "startType" ? "start" : "duration";
    //   const updatedFields = resetTypes(value, prefix);
    
    //   setFormData((prev) => ({
    //     ...prev,
    //     [name]: value, // Save the type itself
    //     ...updatedFields, // Reset only fields related to that prefix
    //   }));
    // }

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("event submitted");

    try {
   
      
        console.log("Event Type: ", formData.eventType);
        const response = await fetch('http://localhost:3000/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          console.log('Events saved successfully');
          setShowEventsForm(false);
        } else {
          console.error('Failed to save events details');
        }

       //TODO: not sure if this is the best way to handle this -> discuss with tai


    } catch (error) {
      console.error('Error:', error);
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
          <input type="text" name="name" placeholder="Event name" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <label>Description: </label>
          <input type="text" name="description" placeholder="Describe your event..." value={formData.description} onChange={handleChange} required />
        </div>

        <div>
          <label>Start year:</label>
          <select name="startType" value={formData.startType} onChange={handleChange}>
            <option value="" disabled>Select start year</option>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
            <option value="same_year">Same year as event series</option>
            <option value="year_after">Year after event series</option>
          </select>
          
          {inputTypes({ type: formData.startType, formData, handleChange, prefix: "start" })}
        
      

        </div>

        <div>
          <label>Duration: </label>
          <select name="durationType" value={formData.durationType} onChange={handleChange}>
            <option value="" disabled>Select Duration</option>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>

          {inputTypes({ type: formData.durationType, formData, handleChange, prefix: "duration"  })}
        </div>

        <div>
          <label>Event Type </label>
          <select name="eventType" value={formData.eventType} onChange={handleChange} required>
            <option value="" disabled>Select event type</option>
            <option value="income">Income</option> 
            <option value="invest">Invest</option>
            <option value="rebalance">Rebalance</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {formData.eventType === 'income' && (
          <>
            <IncomeEvent formData={formData} handleChange={handleChange} /> {/* pass as props */}
          </>
        )}

        {formData.eventType === 'expense' && (
          <ExpenseEvent formData={formData} handleChange={handleChange} />
        )}

      {(formData.eventType === 'invest') && (
        <>
          <InvestEvent formData={formData} handleChange={handleChange} /> {/* pass as props */}
        </>
      )}

      {(formData.eventType === 'rebalance') && (
        <>
          <RebalanceEvent formData={formData} handleChange={handleChange} /> {/* pass as props */}
        </>
      )}

        <div>
          <button type="button" onClick={handleBack}>Back</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
};

export default EventsForm;

const IncomeEvent = ({ formData, handleChange }) => {
  return (
    <>
      <div>
        <label>Initial Amount: $</label>
        <input type="number" name="initialAmount" min="0" placeholder="0.00" value={formData.initialAmount} onChange={handleChange} required />
      </div>

      <div>
          <label>Expected Annual Change: </label>
          <select name="annualChangeType" value={formData.annualChangeType} onChange={handleChange}>
            <option value="" disabled>Select format</option>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>
          <select>
            <option>Amount</option>
            <option>Percentage</option>
          </select>


          {inputTypes({ type: formData.annualChangeType, formData, handleChange, prefix: "annualChange"  })}
        </div>
  
      <div>
          <label>
            <input type="checkbox" name="inflationAdjusted" checked={formData.inflationAdjusted} onChange={handleChange} />
            Inflation Adjusted
          </label>
      </div>
  
      <div>
          <label>User Percentage:</label>
          <input type="text" name="userPercentage" value={formData.userPercentage} onChange={handleChange} required />
       </div>
  
          {/* TODO: only show this if the user is status married */}
      <div>
          <label>Spouse Percentage:</label>
          <input type="text" name="spousePercentage" value={formData.spousePercentage} onChange={handleChange} required />
      </div>
  
      <div>
          <label>
            <input type="checkbox" name="isSocialSecurity" checked={formData.isSocialSecurity} onChange={handleChange} />
            Social Security
          </label>
      </div>
  
  
      </>
    );
  };
  

const RebalanceEvent = ({ formData, handleChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [allocationPercentages, setAllocationPercentages] = useState({});
  const [sumWarning, setSumWarning] = useState("");
  const [taxStatus, setTaxStatus] = useState("");

  // Fetch investments not in pre-tax accounts
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        
        const queryString = taxStatus ? `taxStatus=${taxStatus}` : "";
        const response = await fetch(`http://localhost:3000/api/get-investments?${queryString}`);
        
        if (!response.ok) {
          console.error('Failed to fetch investments:', response.status);
          return;
        }

        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching investments:', error);
      }
    };

    if (formData.allocationMethod === "fixed_percentage" || formData.allocationMethod === "glide_path") {
      fetchInvestments();
    }
  }, [taxStatus, formData.allocationMethod]);

  const handleTaxStatusChange = (e) => {
    setTaxStatus(e.target.value);
  };

  // Calculate sum of percentages for validation
  const validateAllocationSums = () => {
    let sum = 0;
    if (formData.allocationMethod === "fixed_percentage") {
      sum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.start || 0), 0);
    } else if (formData.allocationMethod === "glide_path") {
      const startSum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.start || 0), 0);
      const endSum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.end || 0), 0);
      if (startSum !== 100 || endSum !== 100) {
        setSumWarning(`Start and end allocations must each sum to 100%. Start = ${startSum}%, End = ${endSum}%`);
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
    setAllocationPercentages(prev => ({
      ...prev,
      [investmentId]: { start: parseFloat(percentage) || 0 }
    }));
  };

  const handleGlidePathChange = (investmentId, type, percentage) => {
    setAllocationPercentages(prev => {
      const newAlloc = { ...prev };
      if (!newAlloc[investmentId]) newAlloc[investmentId] = { start: 0, end: 0 };
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
              <option value="" disabled>Select Tax Status</option>
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
          checked={formData.allocationMethod === 'fixed_percentage'} 
          onChange={handleChange} 
        />
        Fixed percentage
        <input 
          type="radio" 
          name="allocationMethod" 
          value="glide_path" 
          checked={formData.allocationMethod === 'glide_path'} 
          onChange={handleChange} 
        /> 
        Glide path
      </div>

      {sumWarning && (
        <div style={{ color: "red", fontWeight: "bold" }}>
          {sumWarning}
        </div>
      )}

      {formData.allocationMethod === 'fixed_percentage' && (
        <div>
          <label>Fixed percentage allocations (must sum to 100%):</label>
          {accounts.map(account => (
            <div key={account.id}>
              <label>{account.investment_type} (${account.dollar_value}):</label>
              <input
                type="number"
                value={allocationPercentages[account.id]?.start || ""}
                onChange={(e) => handleFixedPercentageChange(account.id, e.target.value)}
                min={0}
                required
              />
              <span>%</span>
            </div>
          ))}
        </div>
      )}

      {formData.allocationMethod === 'glide_path' && (
        <div>
          <label>Glide Path Allocations (start and end must each sum to 100%):</label>
          {accounts.map(account => (
            <div key={account.id}>
              <label>{account.investment_type} (${account.dollar_value}):</label>
              <div>
                <label>Start:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.start || ""}
                  onChange={(e) => handleGlidePathChange(account.id, 'start', e.target.value)}
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
                  onChange={(e) => handleGlidePathChange(account.id, 'end', e.target.value)}
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

}


const InvestEvent = ({ formData, handleChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [allocationPercentages, setAllocationPercentages] = useState({});
  const [maxCash, setMaxCash] = useState("");
  const [sumWarning, setSumWarning] = useState("");

  // Fetch investments not in pre-tax accounts
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const taxStatus = ["After-Tax", "Non-Retirement"];
        const queryString = taxStatus.map(status => `taxStatus=${status}`).join('&');
        const response = await fetch(`http://localhost:3000/api/get-investments?${queryString}`);
        
        if (!response.ok) {
          console.error('Failed to fetch investments:', response.status);
          return;
        }

        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching investments:', error);
      }
    };

    if (formData.allocationMethod === "fixed_percentage" || formData.allocationMethod === "glide_path") {
      fetchInvestments();
    }
  }, [formData.allocationMethod]);

  // Calculate sum of percentages for validation
  const validateAllocationSums = () => {
    let sum = 0;
    if (formData.allocationMethod === "fixed_percentage") {
      sum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.start || 0), 0);
    } else if (formData.allocationMethod === "glide_path") {
      const startSum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.start || 0), 0);
      const endSum = Object.values(allocationPercentages).reduce((acc, val) => acc + parseFloat(val?.end || 0), 0);
      if (startSum !== 100 || endSum !== 100) {
        setSumWarning(`Start and end allocations must each sum to 100%. Start = ${startSum}%, End = ${endSum}%`);
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
    setAllocationPercentages(prev => ({
      ...prev,
      [investmentId]: { start: parseFloat(percentage) || 0 }
    }));
  };

  const handleGlidePathChange = (investmentId, type, percentage) => {
    setAllocationPercentages(prev => {
      const newAlloc = { ...prev };
      if (!newAlloc[investmentId]) newAlloc[investmentId] = { start: 0, end: 0 };
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
          checked={formData.allocationMethod === 'fixed_percentage'} 
          onChange={handleChange} 
        />
        Fixed percentage
        <input 
          type="radio" 
          name="allocationMethod" 
          value="glide_path" 
          checked={formData.allocationMethod === 'glide_path'} 
          onChange={handleChange} 
        /> 
        Glide path
      </div>

      <div>
        <label>Maximum Cash to Hold at Year-End:</label>
        <input
          type="number"
          name="maxCash"
          value={maxCash}
          onChange={(e) => setMaxCash(e.target.value)}
          min={0}
        />
      </div>

      {sumWarning && (
        <div style={{ color: "red", fontWeight: "bold" }}>
          {sumWarning}
        </div>
      )}

      {formData.allocationMethod === 'fixed_percentage' && (
        <div>
          <label>Fixed percentage allocations (must sum to 100%):</label>
          {accounts.map(account => (
            <div key={account.id}>
              <label>{account.investment_type} (${account.dollar_value}):</label>
              <input
                type="number"
                value={allocationPercentages[account.id]?.start || ""}
                onChange={(e) => handleFixedPercentageChange(account.id, e.target.value)}
                min={0}
                required
              />
              <span>%</span>
            </div>
          ))}
        </div>
      )}

      {formData.allocationMethod === 'glide_path' && (
        <div>
          <label>Glide Path Allocations (start and end must each sum to 100%):</label>
          {accounts.map(account => (
            <div key={account.id}>
              <label>{account.investment_type} (${account.dollar_value}):</label>
              <div>
                <label>Start:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.start || ""}
                  onChange={(e) => handleGlidePathChange(account.id, 'start', e.target.value)}
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
                  onChange={(e) => handleGlidePathChange(account.id, 'end', e.target.value)}
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

const ExpenseEvent = ({formData, handleChange}) => {
  return (
    <>
      <div>
        <label>Initial Amount: $</label>
        <input type="number" name="initialAmount" min="0" placeholder="0.00" value={formData.initialAmount} onChange={handleChange} required />
      </div>

      <div>
          <label>Expected Annual Change: </label>
          <select name="annualChangeType" value={formData.annualChangeType} onChange={handleChange}>
            <option value="" disabled>Select format</option>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>

          {inputTypes({ type: formData.annualChangeType, formData, handleChange, prefix: "annualChange"  })}
        </div>
  
      <div>
          <label>
            <input type="checkbox" name="inflationAdjusted" checked={formData.inflationAdjusted} onChange={handleChange} />
            Inflation Adjusted
          </label>
      </div>
  
      <div>
          <label>User Percentage:</label>
          <input type="text" name="userPercentage" value={formData.userPercentage} onChange={handleChange} required />
       </div>
  
          {/* TODO: only show this if the user is status married */}
      <div>
          <label>Spouse Percentage:</label>
          <input type="text" name="spousePercentage" value={formData.spousePercentage} onChange={handleChange} required />
      </div>
  
      <div>
          <label>Discretionary</label>
          <input type="checkbox" name="discretionary" value={formData.discretionary || ''} onChange={handleChange} />
      </div>
  
  
      </>
    );
}



