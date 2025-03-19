import React, { useState } from 'react';

const EventsForm = ({ setShowEventsForm }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startType: '',
    startValue: '',
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
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "startType" && value !== "fixed") {
      setFormData((prev) => ({ ...prev, startValue: "" }));
    }
    if (name === "durationType" && value !== "fixed") {
      setFormData((prev) => ({ ...prev, durationValue: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
            <option value="same_year">Same year as event series</option>
            <option value="year_after">Year after event series</option>
          </select>
          {formData.startType === 'fixed' && (
            <input type="text" name="startValue" placeholder="Enter value" value={formData.startValue} onChange={handleChange} required />
          )}
        </div>

        <div>
          <label>Duration: </label>
          <select name="durationType" value={formData.durationType} onChange={handleChange}>
            <option value="fixed">Fixed</option> 
            <option value="normal_distribution">Normal Distribution</option>
            <option value="uniform_distribution">Uniform Distribution</option>
          </select>
          {formData.durationType === 'fixed' && (
            <input type="number" name="durationValue" min="0" placeholder="0" value={formData.durationValue} onChange={handleChange} required />
          )}
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
            <label>Some expense question</label>
            <input type="text" name="expenseQuestion" value={formData.expenseQuestion || ''} onChange={handleChange} />
          </>
        )}

      {(formData.eventType === 'invest' || formData.eventType === 'rebalance') && (
        <>
          <InvestRebalanceEvent formData={formData} handleChange={handleChange} /> {/* pass as props */}
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
          <option value="fixed_amt">Fixed Amount</option>
          <option value="fixed_percent">Fixed Percentage</option>
          <option value="normal_distribution">Normal Distribution</option>
          <option value="uniform_distribution">Uniform Distribution</option>
        </select>
        {formData.annualChangeType === 'fixed_amt' && (
          <input type="number" name="annualChangeValue" min="0" placeholder="0.00" value={formData.annualChangeValue} onChange={handleChange} required />)}
        {formData.annualChangeType === 'fixed_percent' && (
          <input type="number" name="annualChangeValue" min="0" max="100" placeholder="0%" value={formData.annualChangeValue} onChange={handleChange} required />)}
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
const InvestRebalanceEvent = ({ formData, handleChange }) => {

    return (
      <>
        <div>
          {/* Copilot prompt: How do I make a multiple-choice input instead of checkboxes, so the user can only choose one option? */}
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
          {/* TODO: get existing investments from server after sophie sends them */}
          <label>Choose investment</label>
          <input  />
        </div>
      </>
    );
  }


