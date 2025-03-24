import React, { useState, useEffect } from 'react';
import { inputTypes, resetTypes } from '../utils';

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

    if (name === "startType" || name === "durationType") {
      const prefix = name === "startType" ? "start" : "duration";
      setFormData((prev) => ({
        ...prev,
        ...resetTypes(value, prefix),
      }));
    }

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
          <>
            <label>Discretionary</label>
            <input type="checkbox" name="discretionary" value={formData.discretionary || ''} onChange={handleChange} />
          </>
        )}

      {(formData.eventType === 'invest') && (
        <>
          <InvestEvent formData={formData} handleChange={handleChange} /> {/* pass as props */}
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
  
// invest and rebalance are both asset allocation to investment accounts, so they can be combined into one component
const InvestEvent = ({ formData, handleChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [allocationPercentages, setAllocationPercentages] = useState({});

  // Fetch investments when allocation method changes
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

        const data = await response.json()
        console.log("Data: ", data )
        setAccounts(data);
        console.log(`${taxStatus} investments:`, data);
      } catch (error) {
        console.error('Error fetching investments:', error);
      }
    };

    if (formData.allocationMethod) {
      fetchInvestments();
    }
  }, [formData.allocationMethod]);

  // Handle fixed percentage allocation
  const handleFixedPercentageChange = (investmentId, percentage) => {
    setAllocationPercentages((prevState) => {
      const newAllocations = { ...prevState, [investmentId]: { start: percentage } };
      return newAllocations;
    });
  };

  // Handle glide path allocation
  const handleGlidePathChange = (investmentId, type, percentage) => {
    setAllocationPercentages((prevState) => {
      const newAllocations = { ...prevState };
      if (!newAllocations[investmentId]) {
        newAllocations[investmentId] = { start: 0, end: 0 };
      }
      newAllocations[investmentId][type] = percentage;
      return newAllocations;
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

      {formData.allocationMethod === 'fixed_percentage' && (
        <div>
          <label>Fixed percentage allocations:</label>
          {accounts.map((account) => (
            <div >
              <label>Investment Type: {account.investment_type}, $ {account.dollar_value}</label>
              <input
                type="number"
                value={allocationPercentages[account.id]?.start}
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
          <label>Glide Path Allocations:</label>
          {accounts.map((account) => (
            <div >
              <label>Investment Type: {account.investment_type}, $ {account.dollar_value} </label>

              <div>
                <label>Start Allocation:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.start}
                  onChange={(e) => handleGlidePathChange(account.id, 'start', e.target.value)}
                  min={0}
                  required
                />
                <span>%</span>
              </div>

              <div>
                <label>End Allocation:</label>
                <input
                  type="number"
                  value={allocationPercentages[account.id]?.end}
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


