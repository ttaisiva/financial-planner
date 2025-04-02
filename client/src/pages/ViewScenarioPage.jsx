import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {useState, useEffect} from "react";
import { loadAnimation } from "../utils";

//this is for simulation results
export const ViewScenarioPage = () => {
  return (
    <div className="viewscenario-container">
      <Header />
      <h1> Simulation Results</h1>
      <ViewUserScenarios />
      <Footer />
    </div>
  );
};

export default ViewScenarioPage;

// export const ViewUserScenarios = () => {
//   const [scenarios, setScenarios] = useState([]);

//   const fetchScenarios = async () => {
//     try {
//       setScenarios([]); // Reset existing data before fetching new
//       const response = await fetch("http://localhost:3000/api/scenarios", {
//         method: "GET",
//         credentials: "include",
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setScenarios(data);
//       } else {
//         console.error("Failed to fetch scenarios");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   };

//   useEffect(() => {
//     loadAnimation();
//     fetchScenarios();
//   }, []);

//   return (
//     <div className="content-dashboard fade-in">
//       <div className="scenarios-list">
//         {scenarios.length > 0 ? (
//           scenarios.map((scenario, index) => {
//             const renderFields = (fields) =>
//               fields
//                 .filter(({ value }) => value != null)
//                 .map(({ label, value }) => `${label}: ${value}`)
//                 .join(', ');

//             const userFields = [
//               { label: "Life Expectancy Type", value: scenario.user_life_expectancy_type },
//               { label: "Life Expectancy Value", value: scenario.user_life_expectancy_value },
//               { label: "Life Expectancy Mean", value: scenario.user_life_expectancy_mean },
//               { label: "Life Expectancy Std Dev", value: scenario.user_life_expectancy_std_dev },
//               { label: "Retirement Age", value: scenario.user_retirement_age_type },
//               { label: "Retirement Age Value", value: scenario.user_retirement_age_value },
//               { label: "Retirement Age Mean", value: scenario.user_retirement_age_mean },
//               { label: "Retirement Age Std Dev", value: scenario.user_retirement_age_std_dev },
//             ];

//             const spouseFields = [
//               { label: "Life Expectancy Type", value: scenario.spouse_life_expectancy_type },
//               { label: "Life Expectancy Value", value: scenario.spouse_life_expectancy_value },
//               { label: "Life Expectancy Mean", value: scenario.spouse_life_expectancy_mean },
//               { label: "Life Expectancy Std Dev", value: scenario.spouse_life_expectancy_std_dev },
//               { label: "Retirement Age", value: scenario.spouse_retirement_age_type },
//               { label: "Retirement Age Value", value: scenario.spouse_retirement_age_value },
//               { label: "Retirement Age Mean", value: scenario.spouse_retirement_age_mean },
//               { label: "Retirement Age Std Dev", value: scenario.spouse_retirement_age_std_dev },
//             ];

//             const hasSpouseData = spouseFields.some(({ value }) => value != null);

//             const investmentFields = [
//                 {label: "investment_type", value: scenario.investment_type},
//                 {label: "dollar_value", value: scenario.dollar_value},
//                 {label: "tax_status", value: scenario.tax_status},

//             ]

//             const investmentTypeFields = [
//               { label: "Name", value: scenario.name },
//               { label: "Description", value: scenario.description },
//               { label: "Expected Annual Return Type", value: scenario.expAnnReturnType },
//               { label: "Expected Annual Return Type (Amount or Percentage)", value: scenario.expAnnReturnTypeAmtOrPct },
//               { label: "Expected Annual Return Value", value: scenario.expAnnReturnValue },
//               { label: "Expected Annual Return Std Dev", value: scenario.expAnnReturnStdDev },
//               { label: "Expected Annual Return Mean", value: scenario.expAnnReturnMean },
//               { label: "Expense Ratio", value: scenario.expenseRatio },
//               { label: "Expected Annual Income Type", value: scenario.expAnnIncomeType },
//               { label: "Expected Annual Income Value", value: scenario.expAnnIncomeValue },
//               { label: "Expected Annual Income Std Dev", value: scenario.expAnnIncomeStdDev },
//               { label: "Expected Annual Income Type (Amount or Percentage)", value: scenario.expAnnIncomeTypeAmtOrPct },
//               { label: "Expected Annual Income Mean", value: scenario.expAnnIncomeMean },
//               { label: "Taxability", value: scenario.taxability },
//             ];

//             const eventFields = [
//               { label: "Name", value: scenario.name },
//               { label: "Description", value: scenario.description },
//               { label: "Start Type", value: scenario.startType },
//               { label: "Start Value", value: scenario.startValue },
//               { label: "Start Mean", value: scenario.startMean },
//               { label: "Start Std Dev", value: scenario.startStdDev },
//               { label: "Start Upper", value: scenario.startupper },
//               { label: "Start Lower", value: scenario.startlower },
//               { label: "Duration Type", value: scenario.durationType },
//               { label: "Duration Value", value: scenario.durationValue },
//               { label: "Event Type", value: scenario.eventType },
//               { label: "Event Value", value: scenario.eventValue },
//               { label: "Initial Amount", value: scenario.initialAmount },
//               { label: "Annual Change Type", value: scenario.annualChangeType },
//               { label: "Annual Change Value", value: scenario.annualChangeValue },
//               { label: "Inflation Adjusted", value: scenario.inflationAdjusted },
//               { label: "User Percentage", value: scenario.userPercentage },
//               { label: "Spouse Percentage", value: scenario.spousePercentage },
//               { label: "Is Social Security", value: scenario.isSocialSecurity },
//               { label: "Is Wages", value: scenario.isWages },
//               { label: "Allocation Method", value: scenario.allocationMethod },
//               { label: "Discretionary", value: scenario.discretionary },
//             ];



//             return (
//               <div key={index} className="scenario-item">
//                 <h3>{scenario.scenario_name}</h3>
//                 <h4>User Info</h4>
//                 <p>{scenario.financial_goal}, {scenario.filing_status}, {scenario.state_of_residence}</p>
//                 <p>{renderFields(userFields)}</p>

//                 {hasSpouseData && (
//                   <>
//                     <h4>Spouse Info</h4>
//                     <p>{renderFields(spouseFields)}</p>
//                   </>
//                 )}

//                 <h4>Investments and Investment Types </h4>
//                 <p><strong>Investment Types:</strong> {renderFields(investmentTypeFields)}</p>
//                 <p><strong>Investments: </strong>{renderFields(investmentFields)}</p>
                
//                 <h4>Events </h4>
//                 <p>{renderFields(eventFields)}</p>
//               </div>
//             );
//           })
//         ) : (
//           <p className="fade-in">No scenarios available</p>
//         )}
//       </div>
//     </div>



//   );
// };

export const ViewUserScenarios = () => {
  const [scenarios, setScenarios] = useState([]);

  const fetchScenarios = async () => {
    try {
      setScenarios([]);
      const response = await fetch("http://localhost:3000/api/scenarios", {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      } else {
        console.error("Failed to fetch scenarios");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    loadAnimation();
    fetchScenarios();
  }, []);

  // Utility to render list of key-value fields from an object
  const renderFieldsList = (items) =>
    items.map((obj, i) => (
      <div key={i} className="fields-group">
        {Object.entries(obj)
          .filter(([_, value]) => value != null)
          .map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {value.toString()}</p>
          ))}
        <hr />
      </div>
    ));

  return (
    <div className="content-dashboard fade-in">
      <div className="scenarios-list">
        {scenarios.length > 0 ? (
          scenarios.map((scenario, index) => {
            const userFields = [
              { label: "Life Expectancy Type", value: scenario.user_life_expectancy_type },
              { label: "Life Expectancy Value", value: scenario.user_life_expectancy_value },
              { label: "Life Expectancy Mean", value: scenario.user_life_expectancy_mean },
              { label: "Life Expectancy Std Dev", value: scenario.user_life_expectancy_std_dev },
              { label: "Retirement Age", value: scenario.user_retirement_age_type },
              { label: "Retirement Age Value", value: scenario.user_retirement_age_value },
              { label: "Retirement Age Mean", value: scenario.user_retirement_age_mean },
              { label: "Retirement Age Std Dev", value: scenario.user_retirement_age_std_dev },
            ];

            const spouseFields = [
              { label: "Life Expectancy Type", value: scenario.spouse_life_expectancy_type },
              { label: "Life Expectancy Value", value: scenario.spouse_life_expectancy_value },
              { label: "Life Expectancy Mean", value: scenario.spouse_life_expectancy_mean },
              { label: "Life Expectancy Std Dev", value: scenario.spouse_life_expectancy_std_dev },
              { label: "Retirement Age", value: scenario.spouse_retirement_age_type },
              { label: "Retirement Age Value", value: scenario.spouse_retirement_age_value },
              { label: "Retirement Age Mean", value: scenario.spouse_retirement_age_mean },
              { label: "Retirement Age Std Dev", value: scenario.spouse_retirement_age_std_dev },
            ];

            const hasSpouseData = spouseFields.some(({ value }) => value != null);

            return (
              <div key={index} className="scenario-item">
                <h3>{scenario.scenario_name}</h3>
                <h4>User Info</h4>
                <p>{scenario.financial_goal}, {scenario.filing_status}, {scenario.state_of_residence}</p>
                <p>
                  {userFields
                    .filter(({ value }) => value != null)
                    .map(({ label, value }) => `${label}: ${value}`)
                    .join(", ")}
                </p>

                {hasSpouseData && (
                  <>
                    <h4>Spouse Info</h4>
                    <p>
                      {spouseFields
                        .filter(({ value }) => value != null)
                        .map(({ label, value }) => `${label}: ${value}`)
                        .join(", ")}
                    </p>
                  </>
                )}

                {scenario.investment_types?.length > 0 && (
                  <>
                    <h4>Investment Types</h4>
                    {renderFieldsList(scenario.investment_types)}
                  </>
                )}

                {scenario.investments?.length > 0 && (
                  <>
                    <h4>Investments</h4>
                    {renderFieldsList(scenario.investments)}
                  </>
                )}

                {scenario.events?.length > 0 && (
                  <>
                    <h4>Events</h4>
                    {renderFieldsList(scenario.events)}
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p className="fade-in">No scenarios available</p>
        )}
      </div>
    </div>
  );
};