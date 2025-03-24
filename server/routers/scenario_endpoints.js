import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";

const router = express.Router();


let investmentsLocalStorage = [];
let investmentTypesLocalStorage = [];
let eventsLocalStorage = [];

// Route to handle temporary storage: 
router.post('/investment-type', (req, res) => {
  const investmentTypeData = req.body;
  investmentTypesLocalStorage.push(investmentTypeData);
  console.log('Investment type stored temporarily:', investmentTypeData);
  res.status(200).json(investmentTypeData);
});

router.post('/investments', (req, res) => {
  const investmentData = req.body;
  investmentData.id = investmentsLocalStorage.length; // Assign a unique ID
  investmentsLocalStorage.push(investmentData);
  console.log('Investment stored temporarily:', investmentData);
  res.status(200).json(investmentData);
  console.log("All investments: ", investmentsLocalStorage)
});

router.post('/events', (req, res) => {
  const eventsData = req.body;
  eventsData.id = eventsLocalStorage.length; // Assign a unique ID
  eventsLocalStorage.push(eventsData);
  console.log('Event stored temporarily:', eventsData);
  res.status(200).json(eventsData);
});

router.get('/discretionary-expenses', (req, res) => {
  console.log('Received request for locally stored discretionary expenses.')
  const filtered = eventsLocalStorage.filter((event) => event.discretionary == true)
  res.status(200).json(filtered);
});

router.post('/strategies', (req, res) => {
  eventsLocalStorage.push(req.body);
  console.log('Strategy data stored temporarily.');
  res.status(200).json(req.body);
});

// Route to retrieve temporary storage:
router.get('/investments', (req, res) => {
  console.log("Received request for locally stored investments.")
  res.status(200).json(investmentsLocalStorage);
});

// specifically pre-tax
router.get('/investments-pretax', (req, res) => {
  console.log("Received request for locally stored investments of type pre-tax.")
  const filtered = investmentsLocalStorage.filter((investment) => investment.tax_status === "Pre-Tax")
  res.status(200).json(filtered);
});

router.get('/investment-types', (req, res) => {
  res.status(200).json(investmentTypes);
});

router.post("/user-scenario-info", async (req, res) => {
  console.log("Server received user info request from client..");

  let userId
  if (req.session.user) {  
    userId = req.session.user.id;
    console.log("Authenticated user ID:", userId);

  } 
  else{
    //TODO: need to handle code for guest. -> local storage
  }
  console.log("authenticated", req.session.user)
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
      user_id, scenario_name, financial_goal, filing_status, state_of_residence,
      user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev,
      user_retirement_age_type, user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev,
      spouse_life_expectancy_type, spouse_life_expectancy_value, spouse_life_expectancy_mean, spouse_life_expectancy_std_dev,
      spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, spouse_retirement_age_std_dev
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


  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);

    // Insert into user_scenario_info and get the inserted scenario_id
    console.log("insert user scenario info to database..")
    const [results] = await connection.execute(query, values);
    const scenario_id = results.insertId; //the id of the scenario is the ID it was insert with

    // Step 2: Insert the investment types and investments with scenario_id from Local Storage
    for (const investmentType of investmentTypesLocalStorage) {
      const investmentTypeQuery = `
        INSERT INTO investment_types (scenario_id, name, description, expAnnReturnType, expAnnReturnValue, expAnnReturnTypeAmtOrPct, expenseRatio, expAnnIncomeType, expAnnIncomeValue, expAnnIncomeTypeAmtOrPct, taxability) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const investmentTypeValues = [
        scenario_id,
        investmentType.name,
        investmentType.description,
        investmentType.expAnnReturnType,
        investmentType.expAnnReturnValue,
        investmentType.expAnnReturnTypeAmtOrPct,
        investmentType.expenseRatio,
        investmentType.expAnnIncomeType,
        investmentType.expAnnIncomeValue,
        investmentType.expAnnIncomeTypeAmtOrPct,
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

    // Step 4: Insert events with scenario_id
    for (const event of eventsLocalStorage) {
      const eventsQuery = `
        INSERT INTO events (scenario_id, name, description, start_type, start_value, duration_type, duration_value, event_type, initial_amount, annual_change_type, annual_change_value, inflation_adjusted, user_percentage, spouse_percentage, is_social_security, is_wages, allocation_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const eventsValues = [
        scenario_id,
        event.name,
        event.description,
        event.startType,
        event.startValue,
        event.durationType,
        event.durationValue,
        event.eventType,
        event.initialAmount,
        event.annualChangeType,
        event.annualChangeValue,
        event.inflationAdjusted,
        event.userPercentage,
        event.spousePercentage,
        event.isSocialSecurity,
        event.isWages,
        event.allocationMethod,
      ];
      await connection.execute(eventsQuery, eventsValues);
      console.log(`Event ${event.name} saved to the database.`);
    }    

    // Step 5: Clear temporary data after insertion
    investmentsLocalStorage = [];
    investmentTypesLocalStorage = [];
    eventsLocalStorage = [];

    res.status(200).send("User scenario and related data saved successfully.");
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info and related data.");
  }
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
    expAnnReturnAmtOrPct,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    expAnnIncomeAmtOrPct,
    taxability,
  } = req.body;

  const query =
    "INSERT INTO investment_types (name, description, expAnnReturnType, expAnnReturnAmtOrPct, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue,  expAnnIncomeAmtOrPct, taxability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    description,
    expAnnReturnType,
    expAnnReturnAmtOrPct,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    expAnnIncomeAmtOrPct,
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

router.get('/get-investments', (req, res) => {
  console.log("Server received request for investments..");
  const { taxStatus } = req.query;
  console.log(taxStatus)

  // Filter investments from local storage
  const filteredInvestments = investmentsLocalStorage.filter(investment => taxStatus.includes(investment.tax_status));

  res.json(filteredInvestments);
  console.log(`Sent investments tax statuses ${taxStatus} to client:`, filteredInvestments);
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