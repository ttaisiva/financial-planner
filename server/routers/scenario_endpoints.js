import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";
import { simulation } from "../simulation/monte_carlo_sim.js";
// const { simulation } = require("./monte_carlo_sim");

const router = express.Router();

let investmentsLocalStorage = [];
let investmentTypesLocalStorage = [];
let eventsLocalStorage = [];
let rothLocalStorage = [];
let rmdLocalStorage = [];
let expenseWithdrawalLocalStorage = [];
let spendingLocalStorage = [];

// Route to handle temporary storage:
router.post("/investment-type", (req, res) => {
  const investmentTypeData = req.body;
  investmentTypeData.id = investmentTypesLocalStorage.length;
  investmentTypesLocalStorage.push(investmentTypeData);
  console.log("Investment type stored temporarily:", investmentTypeData);
  res.status(200).json(investmentTypeData);
});

router.post("/investments", (req, res) => {
  const investmentData = req.body;
  investmentData.id = investmentsLocalStorage.length; // Assign a unique ID
  investmentsLocalStorage.push(investmentData);
  console.log("Investment stored temporarily:", investmentData);
  res.status(200).json(investmentData);
  console.log("All investments: ", investmentsLocalStorage);
});

router.post("/events", (req, res) => {
  const eventsData = req.body;
  eventsData.id = eventsLocalStorage.length; // Assign a unique ID
  eventsLocalStorage.push(eventsData);
  console.log("Event stored temporarily:", eventsData);
  res.status(200).json(eventsData);
});

router.get("/discretionary-expenses", (req, res) => {
  console.log("Received request for locally stored discretionary expenses.");
  const filtered = eventsLocalStorage.filter(
    (event) => event.discretionary == true
  );
  res.status(200).json(filtered);
});

router.post("/roth-strategy", (req, res) => {
  rothLocalStorage = req.body;
  console.log("Roth strategy data stored temporarily.");
  res.status(200).json(req.body);
});
router.post("/rmd-strategy", (req, res) => {
  rmdLocalStorage = req.body;
  console.log("RMD strategy data stored temporarily.");
  res.status(200).json(req.body);
});
router.post("/expense-withdrawal-strategy", (req, res) => {
  expenseWithdrawalLocalStorage = req.body;
  console.log(expenseWithdrawalLocalStorage);
  console.log("Expense withdrawal strategy data stored temporarily.");
  res.status(200).json(req.body);
});
router.post("/spending-strategy", (req, res) => {
  spendingLocalStorage = req.body;
  console.log(spendingLocalStorage);
  console.log("Spending strategy data stored temporarily.");
  res.status(200).json(req.body);
});

// Route to retrieve temporary storage:
router.get("/investments", (req, res) => {
  console.log("Received request for locally stored investments.");
  res.status(200).json(investmentsLocalStorage);
});

// specifically pre-tax -> which pretax investment is used???
router.get("/investments-pretax", (req, res) => {
  console.log(
    "Received request for locally stored investments of type pre-tax."
  );
  const filtered = investmentsLocalStorage.filter(
    (investment) => investment.tax_status === "Pre-Tax"
  );
  res.status(200).json(filtered);
});

router.get("/investment-types", (req, res) => {
  console.log("Received request for locally stored investment types.");
  res.status(200).json(investmentTypesLocalStorage);
});

router.post("/user-scenario-info", async (req, res) => {
  console.log("Server received user info request from client..");

  let userId;
  if (req.session.user) {
    userId = req.session.user.id;
    console.log("Authenticated user ID:", userId);
  }

  console.log("authenticated", req.session.user);
  const {
    scenarioName,
    financialGoal,
    filingStatus,
    stateOfResidence,
    user,
    spouse,
    inflation_assumption,
  } = req.body;

  const query = `
    INSERT INTO user_scenario_info (
      user_id, scenario_name, financial_goal, filing_status, state_of_residence,
      user_life_expectancy_type, user_life_expectancy_value, user_life_expectancy_mean, user_life_expectancy_std_dev,
      user_retirement_age_type, user_retirement_age_value, user_retirement_age_mean, user_retirement_age_std_dev, user_birth_year,
      spouse_life_expectancy_type, spouse_life_expectancy_value, spouse_life_expectancy_mean, spouse_life_expectancy_std_dev,
      spouse_retirement_age_type, spouse_retirement_age_value, spouse_retirement_age_mean, spouse_retirement_age_std_dev, spouse_birth_year,
      inflation_assumption_type, inflation_assumption_value, inflation_assumption_mean, inflation_assumption_stdev,
      inflation_assumption_lower, inflation_assumption_upper
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ? ,?, ?, ?)
  `;

  const values = [
    userId || null,
    scenarioName || null,
    financialGoal || null,
    filingStatus || null,
    stateOfResidence || null,
    user.lifeExpectancy.type || null,
    user.lifeExpectancy.value || null,
    user.lifeExpectancy.mean || null,
    user.lifeExpectancy.stdDev || null,
    user.retirementAge.type || null,
    user.retirementAge.value || null,
    user.retirementAge.mean || null,
    user.retirementAge.stdDev || null,
    user.birthYear || null,
    spouse.lifeExpectancy.type || null,
    spouse.lifeExpectancy.value || null,
    spouse.lifeExpectancy.mean || null,
    spouse.lifeExpectancy.stdDev || null,
    spouse.retirementAge.type || null,
    spouse.retirementAge.value || null,
    spouse.retirementAge.mean || null,
    spouse.retirementAge.stdDev || null,
    spouse.birthYear || null,
    inflation_assumption.type || null,
    inflation_assumption.value || null,
    inflation_assumption.mean || null,
    inflation_assumption.stdDev || null,
    inflation_assumption.upper || null,
    inflation_assumption.lower || null,
  ];

  //Insert all Scenario data into DB
  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);

    // Insert into user_scenario_info and get the inserted scenario_id
    console.log("insert user scenario info to database..");
    const [results] = await connection.execute(query, values);
    const scenario_id = results.insertId; //the id of the scenario is the ID it was insert with
    req.session.user["scenario_id"] = scenario_id; // Store the scenario ID in the session
    console.log("Scenario ID:", scenario_id);

    // insert all data into db
    await insertInvestmentTypes(
      connection,
      scenario_id,
      investmentTypesLocalStorage
    );
    await insertInvestment(connection, scenario_id, investmentsLocalStorage);
    await insertEvents(connection, scenario_id, eventsLocalStorage);
    let strategyLocalStorage = [
      rothLocalStorage,
      rmdLocalStorage,
      spendingLocalStorage,
      expenseWithdrawalLocalStorage,
    ];
    await insertStrategies(connection, scenario_id, rothLocalStorage, rmdLocalStorage,
      expenseWithdrawalLocalStorage, spendingLocalStorage
    );

    //  Clear temporary data after insertion NO NEED THIS FOR GUEST RESET AFTER SIM. IS COMPLELTED
    console.log("All temporary storage cleared");
    investmentsLocalStorage = [];
    investmentTypesLocalStorage = [];
    eventsLocalStorage = [];
    rothLocalStorage = [];
    rmdLocalStorage = [];
    spendingLocalStorage = [];
    expenseWithdrawalLocalStorage = [];
    strategyLocalStorage = [];

    console.log("User scenario info and related data saved successfully.");
    res
      .status(200)
      .json({
        message: "User scenario and related data saved successfully.",
        scenario_id,
      });
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info and related data.");
  }

});

router.get("/pre-tax-investments", async (req, res) => {
  console.log("Server received request for pre-tax type investments..");

  const query = "SELECT * FROM investments WHERE tax_status = 'pre-tax'";

  try {
    await ensureConnection();
    const [rows] = await connection.execute(query);
    res.json(rows);
    console.log("Sent pre-tax investments to client:", rows);
  } catch (err) {
    console.error("Failed to fetch pre-tax type investments:", err);
    res.status(500).send("Failed to fetch pre-tax type investments");
  }
});

// edit this endpoint to run-simulation-auth and run-simulation-guest for guest send all localStorageData
router.post("/run-simulation", async (req, res) => {
  try {
    const { userId, scenarioId, numSimulations} = req.body;

    // userId = req.session.user['id'];
    // scenarioId = req.session.user['scenario_id'];
    // console.log("user id", req.session.user['id']); //why are these undefined??
    // console.log("scenario id", req.session.user['scenario_id']);

    const currentYear = new Date().getFullYear();
    console.log(`User #${userId} is requesting ${numSimulations} simulations for scenario #${scenarioId}.`);

    // Call the Monte Carlo simulation function
    const results = simulation(
      currentYear,
      numSimulations,
      userId,
      scenarioId,
      connection
    );

    // Send the results back to the client
    res.json(results);
  } catch (error) {
    console.error("Error running simulation:", error);
    res.status(500).send("Failed to run simulation");
  }
});

router.get("/single-scenario", async (req, res) => {
  console.log("Display single scenario in server");
  console.log(req.session.user);
  //const scenarioId = await waitForScenarioId();
  const scenarioId = req.query.scenarioId;
  const userId = req.session.user["id"];

  console.log("scenario id: ", scenarioId);
  console.log("user id: ", userId);

  if (!scenarioId) {
    return res.status(400).send("Scenario ID is not available in the session.");
  }

  await ensureConnection();
  await createTablesIfNotExist(connection);

  // 1. Fetch user scenario info
  const [scenarios] = await connection.execute(
    `SELECT * FROM user_scenario_info WHERE user_id = ? AND id = ?`,
    [userId, scenarioId]
  );

  if (scenarios.length === 0) {
    return res.status(200).json([]); // No scenario found
  }

  const scenario = scenarios[0]; // Grab the single scenario object

  // 2. Fetch all related data
  const [investments] = await connection.query(
    `SELECT * FROM investments WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [investmentTypes] = await connection.query(
    `SELECT * FROM investment_types WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [events] = await connection.query(
    `SELECT * FROM events WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [strategy] = await connection.query(
    `SELECT * FROM strategy WHERE scenario_id = ? ORDER BY strategy_order`,
    [scenarioId]
  );

  // 3. Assemble the full scenario object
  const scenarioWithDetails = {
    ...scenario,
    investments,
    investment_types: investmentTypes,
    events,
    strategy,
  };

  res.status(200).json(scenarioWithDetails);
});

router.get("/scenarios", async (req, res) => {
  console.log("Display scenarios in server");
  console.log(req.session.user);

  try {
    if (!req.session.user) {
      return res.status(401).send("User is not authenticated.");
    }

    const userId = req.session.user["id"];
    console.log("user id: ", userId);

    await ensureConnection();
    await createTablesIfNotExist(connection);

    // 1. Fetch user scenarios
    const [scenarios] = await connection.execute(
      `SELECT * FROM user_scenario_info WHERE user_id = ?`,
      [userId]
    );

    if (scenarios.length === 0) {
      return res.status(200).json([]); // No scenarios
    }

    // Get all scenario IDs
    const scenarioIds = scenarios.map((s) => s.id);

    // 2. Fetch all related investments, investment types, and events in one go
    const [investments] = await connection.query(
      `SELECT * FROM investments WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [investmentTypes] = await connection.query(
      `SELECT * FROM investment_types WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [events] = await connection.query(
      `SELECT * FROM events WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [strategies] = await connection.query(
      `SELECT * FROM strategy WHERE scenario_id IN (?) ORDER BY strategy_order`,
      [scenarioIds]
    );

    // 3. Group related data under each scenario
    const scenarioMap = scenarios.map((scenario) => {
      return {
        ...scenario,
        investments: investments.filter(
          (inv) => inv.scenario_id === scenario.id
        ),
        investment_types: investmentTypes.filter(
          (type) => type.scenario_id === scenario.id
        ),
        events: events.filter((evt) => evt.scenario_id === scenario.id),
        strategies: strategies.filter(
          (strat) => strat.scenario_id === scenario.id
        ),
      };
    });

    //console.log("Formatted scenarios:", scenarioMap);
    res.status(200).json(scenarioMap);
  } catch (err) {
    console.error("Error retrieving scenarios:", err);
    res.status(500).send("Failed to retrieve scenarios.");
  }
});

router.get("/get-investments", (req, res) => {
  console.log("Server received request for investments..");
  const { taxStatus } = req.query;
  console.log(taxStatus);

  // Check if there's at least one investment with a tax status from taxStatus
  const hasMatchingInvestments = investmentsLocalStorage.some(
    (investment) =>
      taxStatus &&
      investment.tax_status &&
      taxStatus.includes(investment.tax_status)
  );

  // If there are matching investments, proceed with filtering; otherwise, return an empty array
  const filteredInvestments = hasMatchingInvestments
    ? investmentsLocalStorage.filter((investment) =>
        taxStatus.includes(investment.tax_status)
      )
    : [];

  //const filteredInvestments = investmentsLocalStorage.filter(investment => taxStatus.includes(investment.tax_status));

  res.json(filteredInvestments);
  console.log(
    `Sent investments tax statuses ${taxStatus} to client:`,
    filteredInvestments
  );
});

export default router;

async function findInvestmentId(connection, scenario_id, investment) {
  const query = `SELECT id FROM investments WHERE scenario_id = ? AND investment_type = ? AND tax_status = ?`;
  const values = [scenario_id, investment.investment_type, investment.tax_status];
  const [rows] = await connection.execute(query, values);
  return rows.length > 0 ? rows[0].id : null;
}
async function findExpenseId(connection, scenario_id, expense) {
  const query = `SELECT id FROM events WHERE scenario_id = ? AND name = ?`;
  const values = [scenario_id, expense.name];
  const [rows] = await connection.execute(query, values);
  return rows.length > 0 ? rows[0].id : null;
}
async function insertStrategies(connection, scenario_id, rothLocalStorage, rmdLocalStorage, 
  expenseWithdrawalLocalStorage, spendingLocalStorage) {

    // Roth
    console.log("Roth info before inserting to db:", rothLocalStorage);
    rothLocalStorage.rothStartYear = parseInt(rothLocalStorage.rothStartYear, 10);
    rothLocalStorage.rothEndYear = parseInt(rothLocalStorage.rothEndYear, 10);
    console.log("Roth years (int converted):", rothLocalStorage.rothStartYear, rothLocalStorage.rothEndYear);
    const investments = rothLocalStorage.rothConversionStrat;
    for(let i = 0; i < investments.length; i++) { // doesn't run for empty array (if optimizer disabled)
      // make id the investment id from DB
      const id = await findInvestmentId(connection, scenario_id, investments[i]);
      const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        scenario_id,
        "roth",
        id,
        null,
        i,
        rothLocalStorage.rothStartYear,
        rothLocalStorage.rothEndYear
      ];
      await connection.execute(query, values);
    }

    // RMD
    for(let i = 0; i < rmdLocalStorage.length; i++) { // each element is investment
      const id = await findInvestmentId(connection, scenario_id, rmdLocalStorage[i]);
      const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        scenario_id,
        "rmd",
        id,
        null,
        i,
        null,
        null
      ];
      await connection.execute(query, values);
    }

    // Expense Withdrawal
    for(let i = 0; i < expenseWithdrawalLocalStorage.length; i++) { // each element is investment
      const id = await findInvestmentId(connection, scenario_id, expenseWithdrawalLocalStorage[i]);
      const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        scenario_id,
        "expense_withdrawal",
        id,
        null,
        i,
        null,
        null
      ];
      await connection.execute(query, values);
    }

    // Spending
    for(let i = 0; i < spendingLocalStorage.length; i++) { // each element is expense
      const id = await findExpenseId(connection, scenario_id, spendingLocalStorage[i]);
      const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        scenario_id,
        "spending",
        null,
        id,
        i,
        null,
        null
      ];
      await connection.execute(query, values);
    }
    console.log("All strategies for scenario #", scenario_id, "sent to DB.");
}

async function insertEvents(connection, scenario_id, eventsLocal) {
  for (const e of eventsLocal) {
    const eventsQuery = `
      INSERT INTO events (
        scenario_id, name, description, event_type, start_type, start_value, 
        start_mean, start_std_dev, start_lower, start_upper,
        start_series_start, start_series_end, duration_type, 
        duration_value, duration_mean, duration_std_dev, 
        duration_lower, duration_upper, annual_change_type, 
        annual_change_value, annual_change_type_amt_or_pct,
        annual_change_mean, annual_change_std_dev, annual_change_lower,
        annual_change_upper, initial_amount, inflation_adjusted, 
        user_percentage, spouse_percentage, is_social_security, asset_allocation,
        discretionary, max_cash
      )
      VALUES (
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?
      )


    `;

    const eventsValues = [
      scenario_id || null,
      e.name || null,
      e.description || null,
      e.eventType || null,
      e.start?.type || null,

      e.start?.value || 0, // Default to 0 if value is missing
      e.start?.mean || null,
      e.start?.stdDev || null,
      e.start?.upper || null,
      e.start?.lower || null,

      e.start?.series_start || false,
      e.start?.series_end || false,
      e.duration?.type || null,
      e.duration?.value || 0, // Default to 0 if value is missing
      e.duration?.mean || null,

      e.duration?.stdDev || null,
      e.duration?.upper || null,
      e.duration?.lower || null,
      e.expected_annual_change?.type || null,
      e.expected_annual_change?.value || 0, // Default to 0 if missing

      e.expected_annual_change?.type_amt_or_pct || null,
      e.expected_annual_change?.mean || null,
      e.expected_annual_change?.stdDev || null,
      e.expected_annual_change?.upper || null,
      e.expected_annual_change?.lower || null,
      
      e.initialAmount || 0,  // Default to 0 if missing
      e.inflationAdjusted || false,  // Default to false if missing
      e.userPercentage || 0,  // Default to 0 if missing
      e.spousePercentage || 0,  // Default to 0 if missing
      
      e.isSocialSecurity || false,  // Default to false if missing
      e.allocationMethod || null,  // Default to null if missing
      e.discretionary || false,  // Default to false if missing
      e.max_cash || 0,  // Default to 0 if missing
      
    ];

    console.log("Inserting values:", eventsValues);
    await connection.execute(eventsQuery, eventsValues);
    console.log(`Event ${e.name} saved to the database.`);
  }
}

async function insertInvestmentTypes(
  connection,
  scenario_id,
  investmentTypesLocal
) {
  for (const investmentType of investmentTypesLocalStorage) {
    const investmentTypeQuery = `
      INSERT INTO investment_types (scenario_id, name, description, expAnnReturnType, expAnnReturnValue, expAnnReturnMean, expAnnReturnStdDev, expAnnReturnTypeAmtOrPct, expenseRatio, expAnnIncomeType, expAnnIncomeValue, expAnnIncomeMean, expAnnIncomeStdDev, expAnnIncomeTypeAmtOrPct, taxability) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const investmentTypeValues = [
      scenario_id || null,
      investmentType.name || null,
      investmentType.description || null,
      investmentType.expAnnReturn.type || null,
      investmentType.expAnnReturn.value || null,

      investmentType.expAnnReturn.mean || null,
      investmentType.expAnnReturn.stdDev || null,
      investmentType.expAnnReturn.amtOrPct || null,
      investmentType.expenseRatio || null,
      investmentType.expAnnIncome.type || null,

      investmentType.expAnnIncome.value || null,
      investmentType.expAnnIncome.mean || null,
      investmentType.expAnnIncome.stdDev || null,
      investmentType.expAnnIncome.amtOrPct || null,
      investmentType.taxability || null,
    ];
    await connection.execute(investmentTypeQuery, investmentTypeValues);
    console.log(
      `Investment type ${investmentType.name} saved to the database.`
    );
  }
}

async function insertInvestment(
  connection,
  scenario_id,
  investmentsLocalStorage
) {
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
    console.log(
      `Investment ${investment.investment_type} saved to the database.`
    );
  }
}
