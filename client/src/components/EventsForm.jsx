import React, { useState } from 'react';


const EventsForm = ({ type }) => {
  const [formData, setFormData] = useState({
    account_type: '',
    cash_investment_amount: '',
    start_year: '',
    duration: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    console.log('Form submitted for event type', type)
    e.preventDefault();
    // sent to server or somethign
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Customize your {type} event:</h3>
      {type === 'income' && (
        <>
          <label>Some income question</label>
          <input
            type='text'
            name='income question'
            value={formData.account_type}
            onChange={handleChange}
          />
        </>
      )}

        {type === 'expense' && (
        <>
          <label>Some expense question</label>
          <input
            type='text'
            name='expense question'
            value={formData.account_type}
            onChange={handleChange}
          />
        </>
      )}

        {type === 'invest' && (
        <>
          <label>Some invest question</label>
          <input
            type='text'
            name='invest question'
            value={formData.account_type}
            onChange={handleChange}
          />
        </>
      )}

        {type === 'rebalance' && (
        <>
          <label>Some rebalance question</label>
          <input
            type='text'
            name='rebalance question'
            value={formData.account_type}
            onChange={handleChange}
          />
        </>
      )}

        <div>
            <button type='submit'>Submit</button>
        </div>

    </form>
  );
};

export default EventsForm;
