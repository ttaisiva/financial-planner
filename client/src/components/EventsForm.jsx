import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";

const EventsForm = ({ type }) => {

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startType: '',
    startValue: '',
    durationType: '',
    durationValue: '',
    eventType: '',
    eventValue: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    console.log('Form submitted for event type:', type);

    e.preventDefault();
    navigate("/NewScenarioPage") //close form
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Customize your {type} event:</h3>
      <Link to="/NewScenarioPage">
              <button>Back</button>
       </Link>

      <div>
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <label>Description:</label>
        <input type="text" name="description" value={formData.description} onChange={handleChange} required />
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
        <input type="text" name="startValue" placeholder="Enter value" value={formData.startValue} onChange={handleChange} required />
      </div>

      <div>
        <label>Duration:</label>
        <select name="durationType" value={formData.durationType} onChange={handleChange}>
          <option value="fixed">Fixed</option> 
          <option value="normal_distribution">Normal Distribution</option>
          <option value="uniform_distribution">Uniform Distribution</option>
        </select>
        <input type="text" name="durationValue" placeholder="Enter value" value={formData.durationValue} onChange={handleChange} required />
      </div>

      <div>
        <label>Event Type</label>
        <select name="eventType" value={formData.eventType} onChange={handleChange}>
          <option value="income">Income</option> 
          <option value="invest">Invest</option>
          <option value="rebalance">Rebalance</option>
          <option value="expense">Expense</option>
        </select>
        <input type="text" name="eventValue" placeholder="Enter value" value={formData.eventValue} onChange={handleChange} required />
      </div>

      {formData.eventType === 'income' && (
        <>
          <label>Some income question</label>
          <input type="text" name="incomeQuestion" value={formData.incomeQuestion || ''} onChange={handleChange} />
        </>
      )}

      {formData.eventType === 'expense' && (
        <>
          <label>Some expense question</label>
          <input type="text" name="expenseQuestion" value={formData.expenseQuestion || ''} onChange={handleChange} />
        </>
      )}

      {formData.eventType === 'invest' && (
        <>
          <label>Some invest question</label>
          <input type="text" name="investQuestion" value={formData.investQuestion || ''} onChange={handleChange} />
        </>
      )}

      {formData.eventType === 'rebalance' && (
        <>
          <label>Some rebalance question</label>
          <input type="text" name="rebalanceQuestion" value={formData.rebalanceQuestion || ''} onChange={handleChange} />
        </>
      )}

      <div>
        <button type="submit">Save</button>
      </div>
    </form>
  );
};

export default EventsForm;
