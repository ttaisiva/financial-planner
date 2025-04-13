import express from "express";
import { ensureConnection, connection } from "../server.js";
import { createTablesIfNotExist } from "../db_tables.js";
import { simulation } from "../simulation/monte_carlo_sim.js";
import { keysToSnakeCase } from "../utils.js";
import { pool } from "../utils.js";
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
    (investment) => investment.tax_status === "pre-tax"
  );
  res.status(200).json(filtered);
});

router.get("/investment-types", (req, res) => {
  console.log("Received request for locally stored investment types.");
  res.status(200).json(investmentTypesLocalStorage);
});

/**
 * Creates a scenario from the new scenario form
 */
router.post("/create-scenario", async (req, res) => {
  console.log("Server received user info request from client..");

  // for (const investment of investments) {
  //   await connection.query("INSERT INTO investments SET ?", {
  //     ...investment,
  //     scenario_id: scenarioId,
  //   });
  // }

  const { scenario, cashData } = req.body;

  const scenarioSnakeCase = keysToSnakeCase(scenario);
  const cashSnakeCase = keysToSnakeCase(cashData);

  //Insert all Scenario data into DB
  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);
    console.log("Connecting to DB at:", process.env.DB_HOST);

    let userId;
    if (req.session.user) {
      userId = req.session.user.id;
      console.log("Authenticated user ID:", userId);
    }

    // Insert new scenario into scenarios table
    scenarioSnakeCase.user_id = userId;
    const [scenarioResult] = await connection.query(
      "INSERT INTO scenarios SET ?",
      scenarioSnakeCase
    );

    // Insert into scenarios and get the inserted scenario_id
    console.log("insert user scenario info to database..");
    const scenario_id = scenarioResult.insertId; //the id of the scenario is the ID it was insert with
    req.session.user["scenario_id"] = scenario_id; // Store the scenario ID in the session
    console.log("Scenario ID:", scenario_id);

    // Insert cash investment into investments
    const [cashResult] = await connection.query(
      "INSERT INTO investments SET ?",
      {
        ...cashSnakeCase,
        scenario_id: scenario_id,
      }
    );

    // insert local storage data into db
    await insertInvestmentTypes(
      connection,
      scenario_id,
      investmentTypesLocalStorage
    );
    await insertInvestment(connection, scenario_id, investmentsLocalStorage);
    await insertEvents(connection, scenario_id, eventsLocalStorage);

    const strategies = req.body.strategies;
    await insertStrategies(connection, scenario_id, strategies);

    console.log("User scenario info and related data saved successfully.");
    res.status(200).json({
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
    const { userId, scenarioId, numSimulations } = req.body;

    // userId = req.session.user['id'];
    // scenarioId = req.session.user['scenario_id'];
    // console.log("user id", req.session.user['id']); //why are these undefined??
    // console.log("scenario id", req.session.user['scenario_id']);

    const currentYear = new Date().getFullYear();
    console.log(
      `User #${userId} is requesting ${numSimulations} simulations for scenario #${scenarioId}.`
    );

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

/**
 * Sends a single scenario to the client for display
 */
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
    `SELECT * FROM scenarios WHERE user_id = ? AND id = ?`,
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

/**
 * Sends a map of scenarios to the client for display
 */
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
      `SELECT * FROM scenarios WHERE user_id = ?`,
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

  console.log("investment local storage: ", investmentsLocalStorage);

  // Check if there's at least one investment with a tax status from taxStatus
  const hasMatchingInvestments = investmentsLocalStorage.some(
    (investment) =>
      taxStatus &&
      investment.taxStatus &&
      taxStatus.includes(investment.taxStatus)
  );

  // If there are matching investments, proceed with filtering; otherwise, return an empty array
  const filteredInvestments = hasMatchingInvestments
    ? investmentsLocalStorage.filter((investment) =>
        taxStatus.includes(investment.taxStatus)
      )
    : [];

  //const filteredInvestments = investmentsLocalStorage.filter(investment => taxStatus.includes(investment.tax_status));

  res.json(filteredInvestments);
  console.log(
    `Sent investments tax statuses ${taxStatus} to client:`,
    filteredInvestments
  );
});

/**
 * Imports a scenario from a .YAML or .YML file
 */
router.post("/import-scenario", async (req, res) => {
  console.log("Server received user info request from client..");

  let userId;
  if (req.session.user) {
    userId = req.session.user.id;
    console.log("Authenticated user ID:", userId);
  }

  console.log("authenticated", req.session.user);
  const scenario = req.body.scenario;

  const query = `
    INSERT INTO scenarios (
      user_id, name, marital_status, birth_years, life_expectancy, 
      inflation_assumption, financial_goal, residence_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId ?? null,
    scenario.name ?? null,
    scenario.maritalStatus ?? null,
    JSON.stringify(scenario.birthYears) ?? null,
    JSON.stringify(scenario.lifeExpectancy) ?? null,
    JSON.stringify(scenario.inflationAssumption) ?? null,
    scenario.financialGoal ?? null,
    scenario.residenceState ?? null,
  ];

  //Insert all Scenario data into DB
  try {
    await ensureConnection();
    await createTablesIfNotExist(connection);

    // Insert into sccenarios and get the inserted scenario_id
    console.log("insert user scenario info to database..");
    const [results] = await connection.execute(query, values);
    const scenario_id = results.insertId; //the id of the scenario is the ID it was insert with
    req.session.user["scenario_id"] = scenario_id; // Store the scenario ID in the session
    console.log("Scenario ID:", scenario_id);

    // insert all data into db
    await insertInvestmentTypes(
      connection,
      scenario_id,
      req.body.investmentTypes
    );
    await insertInvestment(connection, scenario_id, req.body.investments);
    await insertEvents(connection, scenario_id, req.body.eventSeries);

    const strategies = req.body.strategies;
    await insertStrategies(connection, scenario_id, strategies);

    console.log("User scenario info and related data saved successfully.");
    res.status(200).json({
      message: "User scenario and related data saved successfully.",
      scenario_id,
    });
  } catch (err) {
    console.error("Failed to insert user scenario info:", err);
    res.status(500).send("Failed to save user scenario info and related data.");
  }
});

export default router;

/**
 * Finds the expense id for a given scenario
 * @param connection MySQL connection
 * @param scenario_id id for given scenario
 * @param expense name of expense
 */
async function findExpenseId(connection, scenario_id, expense) {
  const query = `SELECT id FROM events WHERE scenario_id = ? AND name = ?`;
  const values = [scenario_id, expense];
  const [rows] = await connection.execute(query, values);
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Inserts each strategy for the scenario currently being uploaded
 *
 * @param connection MySQL Connection for DB
 * @param scenario_id ID for Current Scenario
 * @param strategies List of strategies to be inserted into DB
 */
async function insertStrategies(connection, scenario_id, strategies) {
  console.log("strategies json", strategies);
  // Roth
  const roth = strategies.roth;
  console.log("Roth info before inserting to db:", roth);
  roth.start = parseInt(roth.start, 10);
  roth.end = parseInt(roth.end, 10);
  console.log("Roth years (int converted):", roth.start, roth.end);
  const investments = roth.strategy;
  for (let i = 0; i < investments.length; i++) {
    // doesn't run for empty array (if optimizer disabled)
    // make id the investment id from DB
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
    expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      scenario_id ?? null,
      "roth",
      investments[i] ?? null,
      null,
      i ?? null,
      roth.start ?? null,
      roth.end ?? null,
    ];
    await connection.execute(query, values);
  }

  // RMD
  for (let i = 0; i < strategies.rmd.length; i++) {
    // each element is investment
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
    expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      scenario_id ?? null,
      "rmd",
      strategies.rmd[i] ?? null,
      null,
      i,
      null,
      null,
    ];
    await connection.execute(query, values);
  }

  // Expense Withdrawal
  for (let i = 0; i < strategies.expense.length; i++) {
    // each element is investment
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
    expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      scenario_id,
      "expense_withdrawal",
      strategies.expense[i],
      null,
      i,
      null,
      null,
    ];
    await connection.execute(query, values);
  }

  // Spending
  for (let i = 0; i < strategies.spend.length; i++) {
    // each element is expense
    const id = await findExpenseId(
      connection,
      scenario_id,
      strategies.spend[i]
    );
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
    expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [scenario_id, "spending", null, id, i, null, null];
    await connection.execute(query, values);
  }
}

/**
 * Inserts each event series for the scenario currently being uploaded
 *
 * @param connection MySQL Connection for DB
 * @param scenario_id ID for Current Scenario
 * @param events List of event series to be inserted into DB
 */
async function insertEvents(connection, scenario_id, events) {
  for (const event of events) {
    event.start = JSON.stringify(event.start) ?? null;
    event.duration = JSON.stringify(event.duration) ?? null;
    event.changeDistribution = JSON.stringify(event.changeDistribution);

    const eventSnakeCase = keysToSnakeCase(event);
    const [eventResult] = await connection.query(
      "INSERT INTO events SET ?",
      eventSnakeCase
    );

    const eventsQuery = `
      INSERT INTO events (
        scenario_id, name, description, type,
        start, duration, change_distribution, initial_amount,
        change_amt_or_pct, inflation_adjusted, user_fraction, social_security,
        asset_allocation, glide_path, asset_allocation2, discretionary,
        max_cash
      )
      VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?
      )
    `;

    const eventsValues = [
      scenario_id ?? null,
      event.name ?? null,
      event.description ?? "",
      event.type ?? null,
      JSON.stringify(event.start) ?? null,
      JSON.stringify(event.duration) ?? null,
      JSON.stringify(event.changeDistribution) ?? null,
      event.initialAmount ?? null,
      event.changeAmtOrPct ?? null,
      event.inflationAdjusted ?? null,
      event.userFraction ?? null,
      event.socialSecurity ?? null,
      event.assetAllocation ?? null,
      event.glidePath ?? null,
      event.assetAllocation2 ?? null,
      event.discretionary ?? null,
      event.maxCash ?? null,
    ];

    console.log("Inserting values:", eventsValues);
    // await connection.execute(eventsQuery, eventsValues);
    console.log(`Event ${event.name} saved to the database.`);
  }
}

/**
 * Inserts each investment type for the scenario currently being uploaded
 *
 * @param connection MySQL Connection
 * @param scenario_id ID for Current Scenario
 * @param investmentTypes List of investment types to be inserted into DB
 */
async function insertInvestmentTypes(connection, scenario_id, investmentTypes) {
  for (const investmentType of investmentTypes) {
    const investmentTypeQuery = `
      INSERT INTO investment_types (scenario_id, name, description, return_distribution, 
      return_amt_or_pct, expense_ratio, income_distribution, income_amt_or_pct, taxability) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const investmentTypeValues = [
      scenario_id ?? null,
      investmentType.name ?? null,
      investmentType.description ?? null,
      investmentType.returnDistribution ?? null,
      investmentType.returnAmtOrPct ?? null,
      investmentType.expenseRatio ?? null,
      investmentType.incomeDistribution ?? null,
      investmentType.incomeAmtOrPct ?? null,
      investmentType.taxability ?? null,
    ];
    await connection.execute(investmentTypeQuery, investmentTypeValues);
    console.log(
      `Investment type ${investmentType.name} saved to the database.`
    );
  }
}

/**
 * Inserts each investment for the scenario currently being uploaded
 *
 * @param connection MySQL Connection
 * @param scenario_id ID for Current Scenario
 * @param investments List of investments to be inserted into DB
 */
async function insertInvestment(connection, scenario_id, investments) {
  for (const investment of investments) {
    const investmentQuery = `
      INSERT INTO investments (id, scenario_id, investment_type, value, tax_status) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const investID = investment.investmentType + " " + investment.taxStatus;
    const investmentValues = [
      investID ?? null,
      scenario_id ?? null,
      investment.investmentType ?? null,
      investment.value ?? null,
      investment.taxStatus ?? null,
    ];
    await connection.execute(investmentQuery, investmentValues);
    console.log(
      `Investment ${investment.investment_type} saved to the database.`
    );
  }
}
