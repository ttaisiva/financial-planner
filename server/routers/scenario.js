import express from "express";
import { createTablesIfNotExist } from "../db_tables.js";
//import { simulation } from "../simulation/monte_carlo_sim.js";
import { managerSimulation } from "../simulation/sim_manager.js";
import {
  keysToSnakeCase,
  removeIdsFromEvents,
  sanitizeToNull,
} from "../utils.js";
import { pool } from "../utils.js";

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

router.get("/event-names", async (req, res) => {
  const { scenarioId } = req.query; // Get scenarioId from query parameters

  if (!scenarioId) {
    return res.status(400).json({ error: "scenarioId is required" });
  }

  try {
    // Query to fetch event names for the given scenarioId
    const [rows] = await pool.execute(
      `SELECT DISTINCT name FROM events WHERE scenario_id = ? ORDER BY name ASC`,
      [scenarioId]
    );

    const eventNames = rows.map((row) => row.name); // Extract event names
    res.status(200).json(eventNames); // Send event names as JSON response
  } catch (error) {
    console.error("Error fetching event names:", error);
    res.status(500).json({ error: "Failed to fetch event names" });
  }
});

router.get("/event-types", async (req, res) => {
  const { scenarioId } = req.query; // Get scenarioId from query parameters

  if (!scenarioId) {
    return res.status(400).json({ error: "scenarioId is required" });
  }

  try {
    // Query to fetch distinct event types for the given scenarioId
    const [rows] = await pool.execute(
      `SELECT DISTINCT type FROM events WHERE scenario_id = ? ORDER BY type ASC`,
      [scenarioId]
    );

    const eventTypes = rows.map((row) => row.type); // Extract event types
    res.status(200).json(eventTypes); // Send event types as JSON response
  } catch (error) {
    console.error("Error fetching event types:", error);
    res.status(500).json({ error: "Failed to fetch event types" });
  }
});

router.get("/invest-events-1d", async (req, res) => {
  const { scenarioId } = req.query;

  if (!scenarioId) {
    return res.status(400).json({ error: "scenarioId is required" });
  }

  try {
    // Query to fetch investment events with exactly two items in asset_allocation
    const [rows] = await pool.execute(
      `
      SELECT id, name, asset_allocation AS assetAllocation
      FROM events
      WHERE scenario_id = ? AND type = 'invest' AND JSON_LENGTH(asset_allocation) = 2
      `,
      [scenarioId]
    );

    // Use asset_allocation directly as an object
    const investEvents = rows.map((row) => ({
      id: row.id,
      name: row.name,
      allocations: row.assetAllocation, // Directly use the object
    }));

    res.status(200).json(investEvents);
  } catch (error) {
    console.error("Error fetching investment events:", error);
    res.status(500).json({ error: "Failed to fetch investment events" });
  }
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
    (investment) => investment.taxStatus === "pre-tax"
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
  //   await pool.query("INSERT INTO investments SET ?", {
  //     ...investment,
  //     scenario_id: scenarioId,
  //   });
  // }

  const { scenario, cashData } = req.body;

  const scenarioSnakeCase = keysToSnakeCase(scenario);
  const cashSnakeCase = keysToSnakeCase(cashData);

  //Insert all Scenario data into DB
  try {
    await createTablesIfNotExist();
    console.log("Connecting to DB at:", process.env.DB_HOST);

    let userId;
    if (req.session.user) {
      userId = req.session.user.id;
      console.log("Authenticated user ID:", userId);
    }

    // Insert new scenario into scenarios table
    scenarioSnakeCase.user_id = userId;
    const [scenarioResult] = await pool.query(
      "INSERT INTO scenarios SET ?",
      scenarioSnakeCase
    );

    // Insert into scenarios and get the inserted scenario_id
    console.log("insert user scenario info to database..");
    const scenario_id = scenarioResult.insertId; //the id of the scenario is the ID it was insert with
    req.session.user["scenario_id"] = scenario_id; // Store the scenario ID in the session
    console.log("Scenario ID:", scenario_id);

    // Insert cash investment into investments
    const [cashResult] = await pool.query("INSERT INTO investments SET ?", {
      ...cashSnakeCase,
      scenario_id: scenario_id,
    });

    // insert local storage data into db
    await insertInvestmentTypes(pool, scenario_id, investmentTypesLocalStorage);
    await insertInvestment(pool, scenario_id, investmentsLocalStorage);

    const cleanEventsLocalStorage = removeIdsFromEvents(eventsLocalStorage);
    await insertEvents(pool, scenario_id, cleanEventsLocalStorage);

    const strategies = req.body.strategies;
    await insertStrategiesNewScenario(
      pool,
      scenario_id,
      rothLocalStorage,
      rmdLocalStorage,
      expenseWithdrawalLocalStorage,
      spendingLocalStorage
    );

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
    const [rows] = await pool.execute(query);
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

    const currentYear = new Date().getFullYear();
    console.log(
      `User #${userId} is requesting ${numSimulations} simulations for scenario #${scenarioId}.`
    );

    // Call the Monte Carlo simulation worker manager function
    const results = await managerSimulation(
      currentYear,
      numSimulations,
      userId,
      scenarioId,
      pool
    );

    // Send the results back to the client
    console.log("Running parallel simulations completed successfully.");
    res.json(results);
  } catch (error) {
    console.error("Error running parallel simulation:", error);
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

  await createTablesIfNotExist();

  // 1. Fetch user scenario info
  const [scenarios] = await pool.execute(
    `SELECT * FROM scenarios WHERE user_id = ? AND id = ?`,
    [userId, scenarioId]
  );

  if (scenarios.length === 0) {
    return res.status(200).json([]); // No scenario found
  }

  const scenario = scenarios[0]; // Grab the single scenario object

  // 2. Fetch all related data
  const [investments] = await pool.query(
    `SELECT * FROM investments WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [investmentTypes] = await pool.query(
    `SELECT * FROM investment_types WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [events] = await pool.query(
    `SELECT * FROM events WHERE scenario_id = ?`,
    [scenarioId]
  );

  const [strategy] = await pool.query(
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

    await createTablesIfNotExist();

    // 1. Fetch user scenarios
    const [scenarios] = await pool.execute(
      `SELECT * FROM scenarios WHERE user_id = ?`,
      [userId]
    );

    if (scenarios.length === 0) {
      return res.status(200).json([]); // No scenarios
    }

    // Get all scenario IDs
    const scenarioIds = scenarios.map((s) => s.id);

    // 2. Fetch all related investments, investment types, and events in one go
    const [investments] = await pool.query(
      `SELECT * FROM investments WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [investmentTypes] = await pool.query(
      `SELECT * FROM investment_types WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [events] = await pool.query(
      `SELECT * FROM events WHERE scenario_id IN (?)`,
      [scenarioIds]
    );

    const [strategies] = await pool.query(
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
      inflation_assumption, after_tax_contribution_limit, financial_goal, residence_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId ?? null,
    scenario.name ?? null,
    scenario.maritalStatus ?? null,
    scenario.birthYears ?? null,
    scenario.lifeExpectancy ?? null,
    scenario.inflationAssumption ?? null,
    scenario.afterTaxContributionLimit ?? null,
    scenario.financialGoal ?? null,
    scenario.residenceState ?? null,
  ];

  //Insert all Scenario data into DB
  try {
    await createTablesIfNotExist();

    // Insert into sccenarios and get the inserted scenario_id
    console.log("insert user scenario info to database..");
    const [results] = await pool.execute(query, values);
    const scenario_id = results.insertId; //the id of the scenario is the ID it was insert with
    req.session.user["scenario_id"] = scenario_id; // Store the scenario ID in the session
    console.log("Scenario ID:", scenario_id);

    // insert all data into db
    await insertInvestmentTypes(pool, scenario_id, req.body.investmentTypes);
    await insertInvestment(pool, scenario_id, req.body.investments);
    await insertEvents(pool, scenario_id, req.body.eventSeries);

    const strategies = req.body.strategies;
    await insertStrategies(pool, scenario_id, strategies);

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

/**
 * Exports a given scenario into a readable .YAML file and sends it to the client for download
 * To download, scenario's user id must match requesters user id
 * @param req.query Holds the scenario ID for the given exported scenario
 */
router.get("/export-scenario", async (req, res) => {
  try {
    // Authorize export by comparing User ID with Scenario
    if (!req.session.user || !req.query) {
      res.status(500).send("Not Authorized");
    }

    // Retrieve scenario object
    const scenario = await getScenario(
      pool,
      req.query.id,
      req.session.user["id"]
    );
    if (!scenario) {
      res.status(500).send("Not Authorized");
    }

    // Past this point is a valid export

    // Retrieve investmentTypes
    const investmentTypes = await getInvestmentTypes(pool, scenario.id);

    // Retrieve investments
    const investments = await getInvestments(pool, scenario.id);

    // Retrieve eventSeries
    const eventSeries = await getEventSeries(pool, scenario.id);

    // Retrieve and parse strategies
    const strategies = await getStrategies(pool, scenario.id);

    // Create object to export
    const exportData = {
      name: scenario.name,
      maritalStatus: scenario.marital_status,
      birthYears: scenario.birth_years,
      lifeExpectancy: scenario.life_expectancy,
      investmentTypes: investmentTypes,
      investments: investments,
      eventSeries: eventSeries,
      inflationAssumption: scenario.inflation_assumption,
      afterTaxContributionLimit: scenario.after_tax_contribution_limit,
      spendingStrategy: strategies.spendingStrategy,
      expenseWithdrawalStrategy: strategies.expenseWithdrawalStrategy,
      RMDStrategy: strategies.RMDStrategy,
      RothConversionOpt: strategies.RothConversionOpt,
      RothConversionStart: strategies.RothConversionStart,
      RothConversionEnd: strategies.RothConversionEnd,
      RothConversionStrategy: strategies.RothConversionStrategy,
      financialGoal: scenario.financial_goal,
      residenceState: scenario.residence_state,
    };
    console.log("EXPORT DATA", exportData);
    res.json(exportData);
  } catch (err) {
    console.error("Failed to export scenario", err);
  }
});

/**
 * Returns the scenario from the database based on ID and user_id
 * @param pool mySQL Connection
 * @param id Scenario ID
 * @param user_id User ID
 * @returns Scenario Object
 */
async function getScenario(pool, id, user_id) {
  const query = `
    SELECT * FROM scenarios WHERE id = ? AND user_id = ?
  `;
  const values = [id, user_id];
  const [rows] = await pool.execute(query, values);
  return rows[0]; // Will return either scenario or undefined
}

/**
 * Returns a list of export-ready investmentTypes for a given scenario
 * @param pool mySQL Connection
 * @param scenario_id scenario ID
 * @returns List of export-ready investmentTypes
 */
async function getInvestmentTypes(pool, scenario_id) {
  const query = `
    SELECT * FROM investment_types WHERE scenario_id = ?
  `;
  const [rows] = await pool.execute(query, [scenario_id]);
  const investmentTypes = [];
  rows.forEach((type) => {
    console.log("investment type check", type);
    const investmentType = {
      name: type.name,
      description: type.description,
      returnAmtOrPct: type.return_amt_or_pct,
      returnDistribution: type.return_distribution,
      expenseRatio: type.expense_ratio,
      incomeAmtOrPct: type.income_amt_or_pct,
      incomeDistribution: type.income_distribution,
      taxability: type.taxability,
    };
    console.log("afer investment type transfer", investmentType);
    investmentTypes.push(investmentType);
  });
  return investmentTypes;
}

/**
 * Returns a list of export-ready investments for a given scenario
 * @param pool mySQL Connection
 * @param scenario_id scenario ID
 * @returns List of export-ready investments
 */
async function getInvestments(pool, scenario_id) {
  const query = `
    SELECT * FROM investments WHERE scenario_id = ?
  `;
  const [rows] = await pool.execute(query, [scenario_id]);
  const investments = [];
  rows.forEach((invest) => {
    const investment = {
      investmentType: invest.investment_type,
      value: +invest.value,
      taxStatus: invest.tax_status,
      id: invest.id,
    };
    investments.push(investment);
  });
  return investments;
}

/**
 * Returns a list of export-ready eventSeries for a given scenario
 * @param pool mySQL Connection
 * @param scenario_id scenario ID
 * @returns List of export-ready eventSeries
 */
async function getEventSeries(pool, scenario_id) {
  const query = `
    SELECT * FROM events WHERE scenario_id = ?
  `;
  const [rows] = await pool.execute(query, [scenario_id]);
  const events = [];
  rows.forEach((e) => {
    const event = {
      name: e.name,
      description: e.description,
      start: e.start,
      duration: e.duration,
      type: e.type,
      initialAmount: e.initial_amount,
      changeAmtOrPct: e.change_amt_or_pct,
      changeDistribution: e.change_distribution,
      inflationAdjusted: e.inflation_adjusted,
      userFraction: e.user_fraction,
      socialSecurity: e.social_security,
      discretionary: e.discretionary,
      assetAllocation: e.asset_allocation,
      glidePath: e.glide_path,
      assetAllocation2: e.asset_allocation2,
      maxCash: e.maxCash,
    };
    events.push(removeNullAndUndefined(event));
  });
  return events;
}

/**
 * Returns a list of strategy data for a given scenario
 * @param pool mySQL Connection
 * @param scenario_id scenario ID
 * @returns List of strategy data for export
 */
async function getStrategies(pool, scenario_id) {
  const query = `
    SELECT * FROM strategy 
    WHERE scenario_id = ? AND strategy_type = ? 
    ORDER BY strategy_order ASC
  `;
  // Uses expense_id
  const [spending] = await pool.execute(query, [scenario_id, "spending"]);
  const spendingStrategy = [];

  const expenseQuery = `
  SELECT * FROM events
  WHERE scenario_id = ? AND type = 'expense' AND id = ?
  `;

  for (const elem of spending) {
    const [expense] = await pool.execute(expenseQuery, [
      scenario_id,
      elem.expense_id,
    ]);
    spendingStrategy.push(expense[0].name);
  }

  // Uses investment_id
  const [expenseWithdrawal] = await pool.execute(query, [
    scenario_id,
    "expense_withdrawal",
  ]);
  const expenseWithdrawalStrategy = [];
  expenseWithdrawal.forEach((elem) => {
    expenseWithdrawalStrategy.push(elem.investment_id);
  });

  // Uses investment_id
  const [rmd] = await pool.execute(query, [scenario_id, "rmd"]);
  const RMDStrategy = [];
  rmd.forEach((elem) => {
    RMDStrategy.push(elem.investment_id);
  });

  // Uses investment_id
  const [roth] = await pool.execute(query, [scenario_id, "roth"]);
  const RothConversionOpt = roth.length !== 0;
  const RothConversionStart = roth[0].start_year;
  const RothConversionEnd = roth[0].end_year;
  const RothConversionStrategy = [];
  roth.forEach((elem) => {
    RothConversionStrategy.push(elem.investment_id);
  });

  const completeData = {
    spendingStrategy: spendingStrategy,
    expenseWithdrawalStrategy: expenseWithdrawalStrategy,
    RMDStrategy: RMDStrategy,
    RothConversionOpt: RothConversionOpt,
    RothConversionStart: RothConversionStart,
    RothConversionEnd: RothConversionEnd,
    RothConversionStrategy: RothConversionStrategy,
  };
  return completeData;
}

/**
 * CHATGPT GENERATED: how can i remove undefined fields in a js object
 * @param obj JS Object for undefined field removal
 * @returns object that has the undefined fields removed
 */
function removeNullAndUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(removeNullAndUndefined)
      .filter((item) => item !== undefined && item !== null); // clean array too
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, removeNullAndUndefined(v)])
    );
  }
  return obj;
}

export default router;

async function findInvestmentId(pool, scenario_id, investment) {
  const query = `SELECT id FROM investments WHERE scenario_id = ? AND investment_type = ? AND tax_status = ?`;
  const values = [scenario_id, investment.investmentType, investment.taxStatus];
  const [rows] = await pool.execute(query, values);
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Finds the expense id for a given scenario
 * @param pool MySQL pool
 * @param scenario_id id for given scenario
 * @param expense name of expense
 */
async function findExpenseId(pool, scenario_id, expense) {
  const query = `SELECT id FROM events WHERE scenario_id = ? AND name = ?`;
  const values = [scenario_id, expense];
  const [rows] = await pool.execute(query, values);
  return rows.length > 0 ? rows[0].id : null;
}

async function insertStrategiesNewScenario(
  pool,
  scenario_id,
  rothLocalStorage,
  rmdLocalStorage,
  expenseWithdrawalLocalStorage,
  spendingLocalStorage
) {
  // Roth
  console.log("Roth info before inserting to db:", rothLocalStorage);
  rothLocalStorage.rothStartYear = sanitizeToNull(
    parseInt(rothLocalStorage.rothStartYear, 10)
  );
  rothLocalStorage.rothEndYear = sanitizeToNull(
    parseInt(rothLocalStorage.rothEndYear, 10)
  );
  console.log(
    "Roth years (int converted):",
    rothLocalStorage.rothStartYear,
    rothLocalStorage.rothEndYear
  );
  const investments = rothLocalStorage.rothConversionStrat;
  if (investments) {
    for (let i = 0; i < investments.length; i++) {
      // doesn't run for empty array (if optimizer disabled)
      // make id the investment id from DB
      const id = await findInvestmentId(pool, scenario_id, investments[i]);
      const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
        expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        scenario_id,
        "roth",
        id,
        null,
        i,
        rothLocalStorage.rothStartYear,
        rothLocalStorage.rothEndYear,
      ];
      await pool.execute(query, values);
    }
  }

  // RMD
  for (let i = 0; i < rmdLocalStorage.length; i++) {
    // each element is investment
    const id = await findInvestmentId(pool, scenario_id, rmdLocalStorage[i]);
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [scenario_id, "rmd", id, null, i, null, null];
    await pool.execute(query, values);
  }

  // Expense Withdrawal
  for (let i = 0; i < expenseWithdrawalLocalStorage.length; i++) {
    // each element is investment
    const id = await findInvestmentId(
      pool,
      scenario_id,
      expenseWithdrawalLocalStorage[i]
    );
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [scenario_id, "expense_withdrawal", id, null, i, null, null];
    await pool.execute(query, values);
  }

  // Spending
  for (let i = 0; i < spendingLocalStorage.length; i++) {
    // each element is expense
    const id = await findExpenseId(pool, scenario_id, spendingLocalStorage[i]);
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
      expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [scenario_id, "spending", null, id, i, null, null];
    await pool.execute(query, values);
  }
  console.log("All strategies for scenario #", scenario_id, "sent to DB.");
}

/**
 * Inserts each strategy for the scenario currently being uploaded
 *
 * @param pool MySQL Connection for DB
 * @param scenario_id ID for Current Scenario
 * @param strategies List of strategies to be inserted into DB
 */
async function insertStrategies(pool, scenario_id, strategies) {
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
    await pool.execute(query, values);
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
    await pool.execute(query, values);
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
    await pool.execute(query, values);
  }

  // Spending
  for (let i = 0; i < strategies.spend.length; i++) {
    // each element is expense
    const id = await findExpenseId(pool, scenario_id, strategies.spend[i]);
    const query = `INSERT INTO strategy (scenario_id, strategy_type, investment_id,
    expense_id, strategy_order, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [scenario_id, "spending", null, id, i, null, null];
    await pool.execute(query, values);
  }
}

/**
 * Inserts each event series for the scenario currently being uploaded
 *
 * @param pool MySQL Connection for DB
 * @param scenario_id ID for Current Scenario
 * @param events List of event series to be inserted into DB
 */
async function insertEvents(pool, scenario_id, events) {
  console.log("events:", events);
  for (const event of events) {
    event.start = JSON.stringify(event.start) ?? null;
    event.duration = JSON.stringify(event.duration) ?? null;
    event.changeDistribution = JSON.stringify(event.changeDistribution);
    event.assetAllocation = JSON.stringify(event.assetAllocation);
    event.assetAllocation2 = JSON.stringify(event.assetAllocation2);
    event.scenarioId = scenario_id;

    const eventSnakeCase = keysToSnakeCase(event);
    // console.log("event snake case", eventSnakeCase);
    const [eventResult] = await pool.query(
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

    // console.log("Inserting values:", eventsValues);
    // await pool.execute(eventsQuery, eventsValues);
    console.log(`Event ${event.name} saved to the database.`);
  }
}

/**
 * Inserts each investment type for the scenario currently being uploaded
 *
 * @param pool MySQL Connection
 * @param scenario_id ID for Current Scenario
 * @param investmentTypes List of investment types to be inserted into DB
 */
async function insertInvestmentTypes(pool, scenario_id, investmentTypes) {
  for (const investmentType of investmentTypes) {
    investmentType.returnDistribution =
      JSON.stringify(investmentType.returnDistribution) ?? null;
    investmentType.incomeDistribution =
      JSON.stringify(investmentType.incomeDistribution) ?? null;
    investmentType.scenarioId = scenario_id;

    const investTypeSnakeCase = keysToSnakeCase(investmentType);
    const [investTypeResult] = await pool.query(
      "INSERT INTO investment_types SET ?",
      investTypeSnakeCase
    );

    // await pool.execute(investmentTypeQuery, investmentTypeValues);
    console.log(
      `Investment type ${investmentType.name} saved to the database.`
    );
  }
}

/**
 * Inserts each investment for the scenario currently being uploaded
 *
 * @param pool MySQL Connection
 * @param scenario_id ID for Current Scenario
 * @param investments List of investments to be inserted into DB
 */
async function insertInvestment(pool, scenario_id, investments) {
  for (const investment of investments) {
    const investmentQuery = `
      INSERT INTO investments (id, scenario_id, investment_type, value, tax_status) 
      VALUES (?, ?, ?, ?, ?)
    `;

    let investID;
    if (investment.investmentType == "cash") {
      investID = "cash";
    } else {
      investID = investment.investmentType + " " + investment.taxStatus;
    }

    const investmentValues = [
      investID ?? null,
      scenario_id ?? null,
      investment.investmentType ?? null,
      investment.value ?? null,
      investment.taxStatus ?? null,
    ];
    await pool.execute(investmentQuery, investmentValues);
    console.log(
      `Investment ${investment.investment_type} saved to the database.`
    );
  }
}
