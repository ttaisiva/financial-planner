import React, { useState } from "react";

const EventType = ({ type }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_type: "", cash_investment_amount: "" , start_year: "", duration: ""}); {/*update these values */}

  const handleChange = (e) => { {/*event hander to update form*/}
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // sent to server or somethign
    
  };

  return (
    <div>
      <h2>Add {type} Event</h2>
      {/* Toggle form visibility based on showForm */}
      <button onClick={() => setShowForm(true)}>
        {showForm ? "Back" : "Add Event"} {/* Button text based on form visibility */}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleChange}
            required
          />
          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
};

export default EventType;
