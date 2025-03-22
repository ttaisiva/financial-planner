import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";

const router = express.Router();

let investmentsLocalStorage = [];
let investmentTypesLocalStorage = [];
// let eventsLocalStorage = [];

// Route to handle temporary storage: 
router.post('/investment-type', (req, res) => {
  const investmentTypeData = req.body;
  investmentTypesLocalStorage.push(investmentTypeData);
  console.log('Investment type stored temporarily:', investmentTypeData);
  res.status(200).json(investmentTypeData);
});

router.post('/investments', (req, res) => {
  const investmentData = req.body;
  investmentsLocalStorage.push(investmentData);
  console.log('Investment stored temporarily:', investmentData);
  res.status(200).json(investmentData);
});

// Route to retrieve temporary storage:
router.get('/investments', (req, res) => {
  res.status(200).json(investments);
});

router.get('/investment-types', (req, res) => {
  res.status(200).json(investmentTypes);
});

router.get('/scenarios', async (req, res) => {
  console.log("Display scenarios in server")
  const query = `
    SELECT 
      usi.*, 
      it.*, 
      i.* 
    FROM 
      user_scenario_info usi
    LEFT JOIN 
      investment_types it ON usi.id = it.scenario_id
    LEFT JOIN 
      investments i ON usi.id = i.scenario_id  
  `;
  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query);
    console.log("Retrieved scenarios:", results);
    res.status(200).json(results);
  } catch (err) {
    console.error("Failed to retrieve scenarios:", err);
    res.status(500).send("Failed to retrieve scenarios");
  }
});



router.post("/user-scenario-info", async (req, res) => {
  console.log("Server received user info request from client..");
  const {
    scenarioName ,
    financialGoal,
    filingStatus,
    stateOfResidence,
    userData,
    spouseData,
  } = req.body;

  const query = `
    INSERT INTO user_scenario_info (
      scenario_name, financial_goal, filing_status, state_of_residence,
      user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev,
      user_retirement_age_type, user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev,
      spouse_life_expectancy_type, spouse_life_expectancy_value, spouse_life_expectancy_mean, spouse_life_expectancy_std_dev,
      spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, spouse_retirement_age_std_dev
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    scenarioName || null,
    financialGoal || null,
    filingStatus || null,
    stateOfResidence || null,
    userData.lifeExpectancyType || null,
    userData.lifeExpectancyValue || null,
    userData.lifeExpectancyMean || null,
    userData.lifeExpectancyStdDev || null,
    userData.retirementAge || null,
    userData.retirementAgeValue || null,
    userData.retirementAgeMean || null,
    userData.retirementAgeStdDev || null,
    spouseData.lifeExpectancyType || null,
    spouseData.lifeExpectancyValue || null,
    spouseData.lifeExpectancyMean || null,
    spouseData.lifeExpectancyStdDev || null,
    spouseData.retirementAge || null,
    spouseData.retirementAgeValue || null,
    spouseData.retirementAgeMean || null,
    spouseData.retirementAgeStdDev || null,
  ];

  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);

    // Insert into user_scenario_info and get the inserted scenario_id
    console.log("insert user scenario info to database..")
    const [results] = await connection.execute(query, values);
    const scenario_id = results.insertId;

    // Step 2: Insert the investment types and investments with scenario_id
    for (const investmentType of investmentTypesLocalStorage) {
      const investmentTypeQuery = `
        INSERT INTO investment_types (scenario_id, name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const investmentTypeValues = [
        scenario_id,
        investmentType.name,
        investmentType.description,
        investmentType.expAnnReturnType,
        investmentType.expAnnReturnValue,
        investmentType.expenseRatio,
        investmentType.expAnnIncomeType,
        investmentType.expAnnIncomeValue,
        investmentType.taxability,
      ];
      await connection.execute(investmentTypeQuery, investmentTypeValues);
      console.log(`Investment type ${investmentType.name} saved to the database.`);
    }

    // Step 3: Insert investments with scenario_id
    for (const investment of investmentsLocalStorage) {
      const investmentQuery = `
        INSERT INTO investments (scenario_id, investment_type, dollar_value, tax_status) 
        VALUES (?, ?, ?, ?)
      `;
      const investmentValues = [
        scenario_id,
        investment.investment_type,
        investment.dollar_value,
        investment.tax_status,
      ];
      await connection.execute(investmentQuery, investmentValues);
      console.log(`Investment ${investment.investment_type} saved to the database.`);
    }

    // Step 4: Insert income events with scenario_id
    // for (const incomeEvent of incomeEventsLocalStorage) {
    //   const incomeEventQuery = `
    //     INSERT INTO income_events (scenario_id, name, description, start_type, start_value, duration_type, duration_value, event_type, initial_amount, annual_change_type, annual_change_value, inflation_adjusted, user_percentage, spouse_percentage, is_social_security, is_wages, allocation_method)
    //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    //   `;
    //   const incomeEventValues = [
    //     scenario_id,
    //     incomeEvent.name,
    //     incomeEvent.description,
    //     incomeEvent.startType,
    //     incomeEvent.startValue,
    //     incomeEvent.durationType,
    //     incomeEvent.durationValue,
    //     incomeEvent.eventType,
    //     incomeEvent.initialAmount,
    //     incomeEvent.annualChangeType,
    //     incomeEvent.annualChangeValue,
    //     incomeEvent.inflationAdjusted,
    //     incomeEvent.userPercentage,
    //     incomeEvent.spousePercentage,
    //     incomeEvent.isSocialSecurity,
    //     incomeEvent.isWages,
    //     incomeEvent.allocationMethod,
    //   ];
    //   await connection.execute(incomeEventQuery, incomeEventValues);
    //   console.log(`Income event ${incomeEvent.name} saved to the database.`);
    // }

    // Step 5: Clear temporary data after insertion
    investmentsLocalStorage = [];
    investmentTypesLocalStorage = [];
    //eventsLocalStorage = [];

    res.status(200).send("User scenario and related data saved successfully.");
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info and related data.");
  }
});





// this needs to be added to temporary storage:
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
    res.status(201).send("Event saved successfully");
  } catch (err) {
    console.error("Failed to insert event:", err);
    res.status(500).send("Failed to save event");
  }
});
export default router;