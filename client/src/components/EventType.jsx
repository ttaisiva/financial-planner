import React, { useState } from 'react';


// 'retirement age' is not part of the definition of a scenario. 
// you don't need a field for entering it. see note 7 in section 2.3 of proj requirements for a comment about retirement age.		
// significant parts of UI are missing: how to enter a new event series, 
// how to enter a new investment type, how to enter investment strategy, how to enter roth conversion strategy, etc.

const EventType = ({ type }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [formData, setFormData] = useState({ account_type: '', cash_investment_amount: '' , start_year: '', duration: ''}); {/*update these values based on the prop passed -> eg btn clicked */}

  const handleChange = (e) => { {/*event hander to update form*/}
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // sent to server or somethign
    
  };

  return (
    <div>
      <h2>Add Event Series </h2>

      {/* Toggle form visibility based on showForm */}
      <button 
        onClick={() => {
          setShowForm(!showForm); // toggle
          setSelectedEventType('income');
        }}
      >
        {showForm && selectedEventType=='income' ? 'Cancel' : 'Add Income Event'}
      </button>

      <button 
        onClick={() => {
          setShowForm(!showForm); // toggle
          setSelectedEventType('expense');
        }}
      >
        {showForm && selectedEventType=='expense' ? 'Cancel': 'Add Expense Event'}
      </button>

      <button 
        onClick={() => {
          setShowForm(!showForm); // toggle
          setSelectedEventType('invest');
        }}
      >
        {showForm && selectedEventType=='invest' ? 'Cancel' : 'Add Invest Event'} {/* FIX THIS */}
      </button>

      <button 
        onClick={() => {
          setShowForm(!showForm); // toggle
          setSelectedEventType('rebalance');
        }}
      >
        {showForm && selectedEventType=='rebalance' ? 'Cancel' : 'Add Rebalance Event'} {/* FIX THIS */}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            type='text'
            name='name'
            placeholder='Name'
            onChange={handleChange}
            required
          />
          <button type='submit'>Submit</button>
        </form>
      )}
    </div>
  );
};

export default EventType;
