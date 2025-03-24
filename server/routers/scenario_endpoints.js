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

router.get('/scenarios', async (req, res) => {
  console.log("Display scenarios in server")


  let userId = null;
  if (req.session.user) {
    userId = req.session.user.id;
  }
  
  // TODO: need to add code for when user is not authenticated

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
    WHERE 
      usi.user_id = ?
  `;
  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    const [results] = await connection.execute(query, [userId]);
    console.log("Retrieved scenarios:", results);
    res.status(200).json(results);
  } catch (err) {
    console.error("Failed to retrieve scenarios:", err);
    res.status(500).send("Failed to retrieve scenarios");
  }
});




router.post("/user-scenario-info", async (req, res) => {
  try {
    console.log("user", req.session.user)
    if (req.session.user) {
      
      const userId = req.session.user['id'];
      console.log("Authenticated user ID:", userId);


      const {
        scenarioName,
        financialGoal,
        filingStatus,
        stateOfResidence,
        userData,
        spouseData,
      } = req.body;

      const query = `
        INSERT INTO user_scenario_info (
          user_id, scenario_name, financial_goal, filing_status, state_of_residence,
          user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev, user_retirement_age_type, 
          user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev, spouse_life_expectancy_type, spouse_life_expectancy_value, 
          spouse_life_expectancy_mean, spouse_life_expectancy_std_dev, spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, 
          spouse_retirement_age_std_dev
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        userId,
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

      // Proceed with the insertion to the database
      await ensureConnection();
      await createTablesIfNotExist(connection);

      const [results] = await connection.execute(query, values);
      console.log("User scenario info inserted successfully.");

      res.status(200).send("Scenario info inserted successfully!");
    } else {
      // User is not authenticated
      res.status(401).send("User is not authenticated.");
    }
  } catch (err) {
    console.error("Error during authentication or insertion:", err);
    res.status(500).send("Failed to insert user scenario info.");
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