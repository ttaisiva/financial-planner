// a. Calculate the generated income, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// b. Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the
// investment type’s taxability is ‘taxable’. (For investments in pre-tax retirement accounts, the income
// is taxable in the year it is withdrawn from the account. For investments in after-tax retirement
// accounts, the income is not taxable.)
// c. Add the income to the value of the investment.
// d. Calculate the change in value, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// e. Calculate this year’s expenses, by multiplying the expense ratio and the average value of the
// investment (i.e., the average of its value at the beginning and end of the year). Subtract the
// expenses from the value.

import { pool } from "../utils.js";
import { sample } from "./preliminaries.js"; // Assuming you have a sampling function for probability distributions

/**
 * Updates investments for the current year.
 * @param {number} scenarioId - The ID of the scenario.
 * @param {number} curYearIncome - Current year's income to be updated.
 * @returns {Object} Updated investments and curYearIncome.
 */
export async function updateInvestments(scenarioId, runningTotals) {
  console.log(`Starting updateInvestments for scenario ID: ${scenarioId}`);

  // Fetch investments and investment types

  const investmentTypes = await getAllInvestmentTypes(scenarioId);

  console.log(
    `Fetched ${runningTotals.investments.length} investments for scenario ID: ${scenarioId}`
  );
  //   console.log("investments", investments);
  console.log(
    `Fetched ${
      Object.keys(investmentTypes).length
    } investment types for scenario ID: ${scenarioId}`
  );

  for (const investment of runningTotals.investments) {
    // console.log(
    //   `Processing investment ID: ${investment.id}, type: ${investment.type}, value: ${investment.value}`
    // );
    console.log("Processing investment:", investment.id);

    const investmentType = investmentTypes[investment.type];

    if (!investmentType) {
      //console.error(`Investment type ${investment.type} not found.`);
      continue; // Skip this investment if its type is not found
    }

    const initialValue = Number(investment.value);
    console.log("Initial value: ", initialValue);

    // a. Calculate the generated income
    let generatedIncome = 0;
    generatedIncome = sample(investmentType.income_distribution);
    console.log(`Generated income (sampled): ${generatedIncome}`);
    // Account for percentage case
    if (investmentType.income_amt_or_pct === "percent") {
      generatedIncome = (generatedIncome / 100) * initialValue;
      console.log(`Generated income (percentage adjusted): ${generatedIncome}`);
    }

    // b. Add the income to curYearIncome if applicable
    if (
      investment.taxStatus === "non-retirement" &&
      investmentType.taxability === "taxable"
    ) {
      runningTotals.curYearIncome =
        Number(runningTotals.curYearIncome) + Number(generatedIncome);

      console.log(
        `Added generated income to curYearIncome. Updated curYearIncome: ${Number(
          runningTotals.curYearIncome
        )}`
      );
    }

    // d. Calculate the change in value
    let changeInValue = 0;
    changeInValue = sample(investmentType.return_distribution);
    console.log(`Change in value (sampled): ${changeInValue}`);
    // Account for percentage case
    if (investmentType.return_amt_or_pct === "percent") {
      changeInValue = (changeInValue / 100) * initialValue;
      console.log(`Change in value (percentage adjusted): ${changeInValue}`);
    }

    // c. Add the income to the value of the investment (initial value of investment) -> reinvest income back into investment
    let updatedValue = initialValue + changeInValue + generatedIncome;
    console.log(
      `Updated value after adding income, change in value,  and initial value: ${updatedValue}`
    );

    // e. Calculate this year’s expenses
    const averageValue = (initialValue + updatedValue) / 2;
    console.log("average value: ", averageValue);
    console.log("expense ratio", investmentType.expense_ratio);
    let expenses = 0;
    if (Number(investmentType.expense_ratio) !== 0) {
      expenses = averageValue * (Number(investmentType.expense_ratio) / 100);
    }

    updatedValue -= expenses;
    console.log(
      `Calculated expenses: ${expenses}. Updated value after subtracting expenses: ${updatedValue}`
    );

    // Ensure the updated value is not negative
    updatedValue = Math.max(updatedValue, 0);
    console.log(`Final updated value (non-negative): ${updatedValue}`);

    // Update investment in the database with the updated value
    investment.value = updatedValue; // Update the investment object
    console.log(
      `Updating investment ID: ${investment.id} with new value: ${updatedValue}`
    );
  }

  console.log(`Finished updating investments for scenario ID: ${scenarioId}`);
}

/**
 * Fetches all investment types for a given scenario from the database.
 * @param {number} scenarioId - The ID of the scenario.
 * @returns {Object} A map of investment types, where the keys are the investment type names and the values are their details.
 */
export async function getAllInvestmentTypes(scenarioId) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
                name,
                description,
                return_distribution,
                return_amt_or_pct,
                expense_ratio,
                income_distribution,
                income_amt_or_pct,
                taxability
             FROM investment_types
             WHERE scenario_id = ?`,
      [scenarioId]
    );

    console.log(
      `Fetched ${rows.length} investment types from the database for scenario ID: ${scenarioId}`
    );
    console.log("rows: ", rows);
    // Convert the rows into a map for easy lookup by investment type name
    const investmentTypes = {};
    rows.forEach((row) => {
      investmentTypes[row.name] = row;
    });

    return investmentTypes; // Return the map of investment types
  } catch (error) {
    console.error("Error fetching investment types:", error);
    throw new Error("Unable to fetch investment types from the database.");
  }
}
