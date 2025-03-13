import React from 'react';

const IncomeEvent = ({ formData, handleChange }) => {
  return (
    <>
      <div>
        <label>Initial Amount:</label>
        <input type="text" name="initialAmount" value={formData.initialAmount} onChange={handleChange} required />
      </div>

      <div>
        <label>Expected Annual Change:</label>
        <select name="annualChangeType" value={formData.annualChangeType} onChange={handleChange}>
          <option value="fixed">Fixed Amount/Percentage</option>
          <option value="normal_distribution">Normal Distribution</option>
          <option value="uniform_distribution">Uniform Distribution</option>
        </select>
        <input type="text" name="annualChangeValue" placeholder="Enter value" value={formData.annualChangeValue} onChange={handleChange} required />
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

export default IncomeEvent;
