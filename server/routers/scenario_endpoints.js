import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";

const router = express.Router();


let investmentsLocalStorage = [];
let investmentTypesLocalStorage = [];
let eventsLocalStorage = [];
let strategyLocalStorage = [];


// Route to handle temporary storage: 
router.post('/investment-type', (req, res) => {
  const investmentTypeData = req.body;
  investmentTypeData.id = investmentTypesLocalStorage.length;
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
  
  strategyLocalStorage.push(req.body); 
  console.log('Strategy data stored temporarily.', req.body);
 
  res.status(200).json(req.body);
});

// Route to retrieve temporary storage:
router.get('/investments', (req, res) => {
  console.log("Received request for locally stored investments.")
  res.status(200).json(investmentsLocalStorage);
});

// specifically pre-tax -> which pretax investment is used???
router.get('/investments-pretax', (req, res) => {
  console.log("Received request for locally stored investments of type pre-tax.")
  const filtered = investmentsLocalStorage.filter((investment) => investment.tax_status === "Pre-Tax")
  res.status(200).json(filtered);
});

router.get('/investment-types', (req, res) => {
  console.log("Received request for locally stored investment types.")
  res.status(200).json(investmentTypesLocalStorage);
});

router.post("/user-scenario-info", async (req, res) => {
  //TODO: modularize this code a bit
  console.log("Server received user info request from client..");

  let userId;
  if (req.session.user) {  
    userId = req.session.user.id;
    console.log("Authenticated user ID:", userId);

  } 
  
 
  console.log("authenticated", req.session.user)
  const {
    scenarioName ,
    financialGoal,
    filingStatus,
    stateOfResidence,
    userData,
    spouseData,
    inflation_assumption
  } = req.body;

  const query = `
    INSERT INTO user_scenario_info (
      user_id, scenario_name, financial_goal, filing_status, state_of_residence,
      user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev,
      user_retirement_age_type, user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev,
      spouse_life_expectancy_type, spouse_life_expectancy_value, spouse_life_expectancy_mean, spouse_life_expectancy_std_dev,
      spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, spouse_retirement_age_std_dev,
      inflation_assumption_type, inflation_assumption_value, inflation_assumption_mean, inflation_assumption_stdev,
      inflation_assumption_lower, inflation_assumption_upper
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ? ,?)
  `;

  const values = [
    userId || null,
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
    inflation_assumption.Type || null,
    inflation_assumption.Value || null, 
    inflation_assumption.Mean || null, 
    inflation_assumption.StdDev || null, 
    inflation_assumption.Upper || null, 
    inflation_assumption.Lower || null, 
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
        scenario_id || null,
        investmentType.name || null,
        investmentType.description || null,
        investmentType.expAnnReturnType || null,
        investmentType.expAnnReturnValue || null,
        investmentType.expAnnReturnTypeAmtOrPct || null,
        investmentType.expenseRatio || null,
        investmentType.expAnnIncomeType || null,
        investmentType.expAnnIncomeValue || null,
        investmentType.expAnnIncomeTypeAmtOrPct || null,
        investmentType.taxability || null,
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
        scenario_id || null,
        investment.investment_type || null,
        investment.dollar_value || null,
        investment.tax_status || null,
      ];
      await connection.execute(investmentQuery, investmentValues);
      console.log(`Investment ${investment.investment_type} saved to the database.`);
    }

    // Step 4: Insert events with scenario_id
    for (const e of eventsLocalStorage) {
      const eventsQuery = `
        INSERT INTO events (scenario_id, name, description, start_type, start_value, duration_type, duration_value, event_type, initial_amount, annual_change_type, annual_change_value, inflation_adjusted, user_percentage, spouse_percentage, is_social_security, is_wages, asset_allocation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const eventsValues = [
        scenario_id || null,
        e.name || null,
        e.description || null,
        e.startType || null,
        e.startValue || null,
        e.durationType || null,
        e.durationValue || null,
        e.eventType || null, 
        e.initialAmount || null,
        e.annualChangeType || null,
        e.annualChangeValue || null,
        e.inflationAdjusted || null,
        e.userPercentage || null,
        e.spousePercentage || null,
        e.isSocialSecurity || null,
        e.isWages || null,
        e.allocationMethod || null,
      ];
      await connection.execute(eventsQuery, eventsValues);
      console.log(`Event ${e.name} saved to the database.`);
      
      
    }    

 
    await insertStrategies(connection, scenario_id, strategyLocalStorage);

    // Step 6: Clear temporary data after insertion
    console.log("All temporary storage cleared");
    investmentsLocalStorage = [];
    investmentTypesLocalStorage = [];
    eventsLocalStorage = [];
    strategyLocalStorage =  [];

    res.status(200).send("User scenario and related data saved successfully.");
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info and related data.");
  }
});


router.get('/scenarios', async (req, res) => {
  console.log("Display scenarios in server");
  // console.log(req.session.user);

  // try {
  //   if (!req.session.user) {
  //     return res.status(401).send("User is not authenticated.");
  //   }

  //   const userId = req.session.user['id'];
  //   console.log("user id: ", userId);

  //   await ensureConnection();
  //   await createTablesIfNotExist(connection);

  //   // 1. Fetch user scenarios
  //   const [scenarios] = await connection.execute(
  //     `SELECT * FROM user_scenario_info WHERE user_id = ?`,
  //     [userId]
  //   );

  //   if (scenarios.length === 0) {
  //     return res.status(200).json([]); // No scenarios
  //   }

  //   // Get all scenario IDs
  //   const scenarioIds = scenarios.map(s => s.id);

  //   // 2. Fetch all related investments, investment types, and events in one go
  //   const [investments] = await connection.query(
  //     `SELECT * FROM investments WHERE scenario_id IN (?)`,
  //     [scenarioIds]
  //   );

  //   const [investmentTypes] = await connection.query(
  //     `SELECT * FROM investment_types WHERE scenario_id IN (?)`,
  //     [scenarioIds]
  //   );

  //   const [events] = await connection.query(
  //     `SELECT * FROM events WHERE scenario_id IN (?)`,
  //     [scenarioIds]
  //   );

  //   //strategies
  //   //     SELECT * FROM strategies 
  //   // WHERE scenario_id = 'scenarioX' 
  //   //   AND strategy_type = 'Roth_conversion'
  //   // ORDER BY strategy_order;

  //   // 3. Group related data under each scenario
  //   const scenarioMap = scenarios.map(scenario => {
  //     return {
  //       ...scenario,
  //       investments: investments.filter(inv => inv.scenario_id === scenario.id),
  //       investment_types: investmentTypes.filter(type => type.scenario_id === scenario.id),
  //       events: events.filter(evt => evt.scenario_id === scenario.id),
  //     };
  //   });

  //   //console.log("Formatted scenarios:", scenarioMap);
  //   res.status(200).json(scenarioMap);

  // } catch (err) {
  //   console.error("Error retrieving scenarios:", err);
  //   res.status(500).send("Failed to retrieve scenarios.");
  // }
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

  
  // Check if there's at least one investment with a tax status from taxStatus
  const hasMatchingInvestments = investmentsLocalStorage.some(investment =>
    taxStatus && investment.tax_status && taxStatus.includes(investment.tax_status)
  );

  // If there are matching investments, proceed with filtering; otherwise, return an empty array
  const filteredInvestments = hasMatchingInvestments
    ? investmentsLocalStorage.filter(investment => taxStatus.includes(investment.tax_status))
    : [];
    
  //const filteredInvestments = investmentsLocalStorage.filter(investment => taxStatus.includes(investment.tax_status));

  res.json(filteredInvestments);
  console.log(`Sent investments tax statuses ${taxStatus} to client:`, filteredInvestments);
});


export default router;


//note: this is rly slow but because how the strategies are sent to server it cant be changed
async function insertStrategies(connection, scenario_id, strategyLocalStorage) {
  const strategyTypes = [
    'rothConversionStrat',
    'rmdStrat',
    'expenseWithdrawalStrat',
    'spendingStrat'
  ];

  console.log("Strategy Local Storage:", JSON.stringify(strategyLocalStorage, null, 2));

  for (const strategy of strategyLocalStorage) { //iterate over strategy object in local storage
    //console.log("Processing strategy:", strategy);

    for (const type of strategyTypes) { //iterate through all these strategy types
      const items = strategy[type];
      console.log(`Processing type: ${type}, Items:`, items);

      if (!Array.isArray(items)) {
        console.log(`No valid items found for strategy type: ${type}`);
        continue;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const strategy_type = type;
        const strategy_order = i;
      
        let investment_id = null;
        let expense_id = null;
      
        if (type !== 'spendingStrat' && item.investment_type) {
          const [rows] = await connection.execute(
            `SELECT id FROM investments WHERE scenario_id = ? AND investment_type = ? AND tax_status = ? LIMIT 1`,
            [scenario_id, item.investment_type, item.tax_status]
          );
          investment_id = rows.length > 0 ? rows[0].id : null;
        }
      
        if (type === 'spendingStrat') {
          const [rows] = await connection.execute(
            `SELECT id FROM events WHERE scenario_id = ? AND name = ? LIMIT 1`,
            [scenario_id, item.name]
          );
          expense_id = item.id;
        }
      
        console.log("Inserting strategy with values:", {
          scenario_id,
          strategy_type,
          investment_id,
          expense_id,
          strategy_order
        });
      
        await connection.execute(
          `INSERT INTO strategy (scenario_id, strategy_type, investment_id, expense_id, strategy_order) VALUES (?, ?, ?, ?, ?)`,
          [scenario_id, String(strategy_type), investment_id, expense_id, strategy_order]
        );
      }
      
    }
  }
}


