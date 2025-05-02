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
  const investmentTypes = await getAllInvestmentTypes(scenarioId);

  for (const investment of runningTotals.investments) {
    const investmentType = investmentTypes[investment.type];

    if (!investmentType) {
      continue; // Skip this investment if its type is not found
    }

    const initialValue = Number(investment.value);

    // a. Calculate the generated income
    let generatedIncome = 0;
    generatedIncome = sample(investmentType.income_distribution);
    if (investmentType.income_amt_or_pct === "percent") {
      generatedIncome = (generatedIncome / 100) * initialValue;
    }

    // b. Add the income to curYearIncome if applicable
    if (
      investment.taxStatus === "non-retirement" &&
      investmentType.taxability === "taxable"
    ) {
      runningTotals.curYearIncome =
        Number(runningTotals.curYearIncome) + Number(generatedIncome);

    }

    // d. Calculate the change in value
    let changeInValue = 0;
    changeInValue = sample(investmentType.return_distribution);
    if (investmentType.return_amt_or_pct === "percent") {
      changeInValue = (changeInValue / 100) * initialValue;
    }

    // c. Add the income to the value of the investment (initial value of investment) -> reinvest income back into investment
    let updatedValue = initialValue + changeInValue + generatedIncome;

    // e. Calculate this year’s expenses
    const averageValue = (initialValue + updatedValue) / 2;
    let expenses = 0;
    if (Number(investmentType.expense_ratio) !== 0) {
      expenses = averageValue * (Number(investmentType.expense_ratio) / 100);
    }

    updatedValue -= expenses;

    // Ensure the updated value is not negative
    updatedValue = Math.max(updatedValue, 0);

    // Update investment in the database with the updated value
    investment.value = updatedValue; // Update the investment object
  }
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
