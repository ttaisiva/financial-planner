import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";

const router = express.Router();

router.post("/events", async (req, res) => {
  //right now this is just handeling income events
  console.log("Server received income event request from client..");
  const {
    name,
    description,
    startType,
    startValue,
    durationType,
    durationValue,
    eventType,
    initialAmount,
    annualChangeType,
    annualChangeValue,
    inflationAdjusted,
    userPercentage,
    spousePercentage,
    isSocialSecurity,
    isWages,
    allocationMethod,
  } = req.body;

  const query = `
    INSERT INTO income_events (
      name, description, start_type, start_value, duration_type, duration_value, event_type,
      initial_amount, annual_change_type, annual_change_value, inflation_adjusted, user_percentage,
      spouse_percentage, is_social_security, is_wages, allocation_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    description,
    startType,
    startValue,
    durationType,
    durationValue,
    eventType,
    initialAmount,
    annualChangeType,
    annualChangeValue,
    inflationAdjusted,
    userPercentage,
    spousePercentage,
    isSocialSecurity,
    isWages,
    allocationMethod,
  ];

  console.log("Send to database..");

  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query, values);
    res.status(201).send("Income event saved successfully");
  } catch (err) {
    console.error("Failed to insert income event:", err);
    res.status(500).send("Failed to save income event");
  }
});

router.post("/user-scenario-info", async (req, res) => {
  console.log("Server received user info request from client..");
  const {
    financialGoal,
    filingStatus,
    stateOfResidence,
    userData,
    spouseData,
  } = req.body;

  const query = `
    INSERT INTO user_scenario_info (
      financial_goal, filing_status, state_of_residence,
      user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev,
      user_retirement_age_type, user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev,
      spouse_life_expectancy_type, spouse_life_expectancy_value, spouse_life_expectancy_mean, spouse_life_expectancy_std_dev,
      spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, spouse_retirement_age_std_dev
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    financialGoal,
    filingStatus,
    stateOfResidence,
    userData.lifeExpectancyType,
    userData.lifeExpectancyValue,
    userData.lifeExpectancyMean,
    userData.lifeExpectancyStdDev,
    userData.retirementAge,
    userData.retirementAgeValue,
    userData.retirementAgeMean,
    userData.retirementAgeStdDev,
    spouseData.lifeExpectancyType,
    spouseData.lifeExpectancyValue,
    spouseData.lifeExpectancyMean,
    spouseData.lifeExpectancyStdDev,
    spouseData.retirementAge,
    spouseData.retirementAgeValue,
    spouseData.retirementAgeMean,
    spouseData.retirementAgeStdDev,
  ];

  console.log("Send to database..");

  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query, values);
    res.status(201).send("User scenario info saved successfully");
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info");
  }
});

router.post("/investments", async (req, res) => {
  console.log("Server received investment request from client..");
  const { investment_type, dollar_value, tax_status } = req.body;
  console.log("make query");
  const query =
    "INSERT INTO investments (investment_type, dollar_value, tax_status) VALUES (?, ?, ?)";
  const values = [investment_type, dollar_value, tax_status];

  console.log("Send to database..");

  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query, values);
    res.status(201).send("Investment saved successfully");
  } catch (err) {
    console.error("Failed to insert investment:", err);
    res.status(500).send("Failed to save investment");
  }
});

router.post("/investment-type", async (req, res) => {
  console.log("Server received investment type request");
  const {
    name,
    description,
    expAnnReturnType,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    taxability,
  } = req.body;

  const query =
    "INSERT INTO investment_types (name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    description,
    expAnnReturnType,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    taxability,
  ];

  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query, values);
    res.status(201).send("Investment type saved successfully");
  } catch (err) {
    console.error("Failed to insert investment type:", err);
    res.status(500).send("Failed to save investment type");
  }
});

export default router;