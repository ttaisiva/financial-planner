import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Investment = () => {
  const [formData, setFormData] = useState({
    investment_type: "",
    dollar_value: "",
    tax_status: "Pre_Tax",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Investment Submitted:", formData);
    // send to server
    navigate("/NewScenarioPage");
  };

  return (
    <div>
      <h2>Create an Investment</h2>
      <Link to="/NewScenarioPage">
        <button>Back</button>
      </Link>

      <form onSubmit={handleSubmit}>
        {/* Investment Type */}
        <div>
          <label>Investment Type:</label>
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
          <label>Dollar Amount:</label>
          <input
            type="text"
            name="dollar_value"
            value={formData.dollar_value}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tax Status */}
        <div>
          <label>Taxability:</label>
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

        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default Investment;
