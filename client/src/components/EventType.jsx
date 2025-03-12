import React, { useState } from 'react';
import EventsForm from './EventsForm';



// 'retirement age' is not part of the definition of a scenario. 
// you don't need a field for entering it. see note 7 in section 2.3 of proj requirements for a comment about retirement age.		
// significant parts of UI are missing: how to enter a new event series, 
// how to enter a new investment type, how to enter investment strategy, how to enter roth conversion strategy, etc.

const EventType = ({ type }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('null');
  const [formData, setFormData] = useState({ account_type: '', cash_investment_amount: '' , start_year: '', duration: ''}); {/*update these values based on the prop passed -> eg btn clicked */}

  const handleChange = (e) => { {/*event hander to update form*/}
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  

  return (
    <div>
      <h2>Add Event Series </h2>

      {/* Toggle form visibility based on showForm */}
      <button 
        onClick={() => {
          setSelectedEventType('income');
          setShowForm(!showForm); // toggle
        }}
      >
        {showForm && selectedEventType=='income' ? 'Cancel' : 'Add Income Event'}
      </button>

      <button 
        onClick={() => {
          setSelectedEventType('expense');
          setShowForm(!showForm); // toggle
        }}
      >
        {showForm && selectedEventType=='expense' ? 'Cancel': 'Add Expense Event'}
      </button>

      <button 
        onClick={() => {
          setSelectedEventType('invest');
          setShowForm(!showForm); // toggle
        }}
      >
        {showForm && selectedEventType=='invest' ? 'Cancel' : 'Add Invest Event'} {/* FIX THIS */}
      </button>

      <button 
        onClick={() => {
          setSelectedEventType('rebalance');
          setShowForm(!showForm); // toggle
        }}
      >
        {showForm && selectedEventType=='rebalance' ? 'Cancel' : 'Add Rebalance Event'} {/* FIX THIS */}
      </button>

      {showForm && <EventsForm type={selectedEventType} />}

    </div>
  );
};

export default EventType;
