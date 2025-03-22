import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";

const router = express.Router();

let investmentsLocalStorage = [];
let investmentTypesLocalStorage = [];

// Route to handle temporary storage: 
router.post('/investment-type', (req, res) => {
  const investmentTypeData = req.body;
  investmentTypesLocalStorage.push(investmentTypeData);
  console.log('Investment type stored temporarily:', investmentTypeData);
  res.status(200).json(investmentTypeData);
});

router.post('/investments', (req, res) => {
  // const investmentData = req.body;
  let investmentData = req.body;
  investmentData.id = investmentsLocalStorage.length; // Assign a unique ID
  investmentsLocalStorage.push(investmentData);
  console.log('Investment stored temporarily:', investmentData);
  res.status(200).json(investmentData);
});

// Route to retrieve temporary storage:
router.get('/investments', (req, res) => {
  console.log("Received request for locally stored investments.")
  console.log((investmentsLocalStorage))
  res.status(200).json(investmentsLocalStorage);
});

// specifically pre-tax
router.get('/investments-pretax', (req, res) => {
  console.log("Received request for locally stored investments of type pre-tax.")
  const filtered = investmentsLocalStorage.filter((investment) => investment.tax_status === "Pre_Tax")
  console.log((filtered))
  res.status(200).json(filtered);
});

router.get('/investment-types', (req, res) => {
  res.status(200).json(investmentTypes);
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

router.post("/run-simulation", async (req, res) => {
  console.log("Running simulation and saving temporary data to database...");
  console.log("Local storage investment type: ", investmentTypesLocalStorage);
  console.log("Local storage investment: ", investmentsLocalStorage);

  // Inserting investment types
  for (const investmentType of investmentTypesLocalStorage) {
    console.log("Inserting investment type:", investmentType);
    const query = `
      INSERT INTO investment_types (name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      investmentType.name,
      investmentType.description,
      investmentType.expAnnReturnType,
      investmentType.expAnnReturnValue,
      investmentType.expenseRatio,
      investmentType.expAnnIncomeType,
      investmentType.expAnnIncomeValue,
      investmentType.taxability,
    ];

    try {
      await ensureConnection();
      await createTablesIfNotExist(connection);
      console.log("Executing query:", query, "with values:", values);
      await connection.execute(query, values);
      console.log(`Investment type ${investmentType.name} saved to the database.`);
    } catch (err) {
      console.error("Failed to insert investment type:", err);
    }
  }

  // Inserting investments
  for (const investment of investmentsLocalStorage) {
    const query = `
      INSERT INTO investments (investment_type, dollar_value, tax_status) 
      VALUES (?, ?, ?)
    `;
    const values = [
      investment.investment_type,
      investment.dollar_value,
      investment.tax_status,
    ];

    try {
      await ensureConnection();
      await createTablesIfNotExist(connection);
      await connection.execute(query, values);
      console.log(`Investment ${investment.investment_type} saved to the database.`);
    } catch (err) {
      console.error("Failed to insert investment:", err);
    }
  }

  // Clear temporary data after insertion
  investmentsLocalStorage = [];
  investmentTypesLocalStorage = [];

  console.log("All temporary data has been saved to the database.");
  res.status(200).send("Simulation run and data saved to the database.");
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

router.get('/pre-tax-investments', async (req, res) => {
  console.log("Server received request for pre-tax type investments..");

  const query = "SELECT * FROM investments WHERE tax_status = 'pre-tax'";

  try {
    await ensureConnection();
    const [rows] = await connection.execute(query);
    res.json(rows);
    console.log('Sent pre-tax investments to client:', rows);
  } catch (err) {
    console.error("Failed to fetch pre-tax type investments:", err);
    res.status(500).send("Failed to fetch pre-tax type investments");
  }
});

// *** don't have expenses yet
// router.get('/discretionary-expenses', async (req, res) => {
//   console.log("Server received request for discretionary expenses..");

//   const query = "SELECT * FROM discretionary_expenses";

//   try {
//     await ensureConnection();
//     const [rows] = await connection.execute(query);
//     res.json(rows);
//   } catch (err) {
//     console.error("Failed to fetch discretionary expenses:", err);
//     res.status(500).send("Failed to fetch discretionary expenses");
//   }
// });

export default router;