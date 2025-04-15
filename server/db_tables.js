import { connection } from "./server.js";
export async function createTablesIfNotExist() {
  const createTaxBracketsTable = `
    CREATE TABLE IF NOT EXISTS tax_brackets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      filing_status VARCHAR(20) NOT NULL,
      tax_rate DECIMAL(3, 2) NOT NULL,
      income_min DECIMAL(10, 0) NOT NULL,
      income_max DECIMAL(10, 0)
    )
  `;

  const createStateTaxBracketsTable = `
  CREATE TABLE IF NOT EXISTS state_tax_brackets (
    state CHAR(2) NOT NULL,
    user_id VARCHAR(255),
    year INT NOT NULL,
    filing_status VARCHAR(20) NOT NULL,
    tax_rate DECIMAL(5, 3) NOT NULL,
    base DECIMAL(10, 2) NOT NULL,
    income_min DECIMAL(10, 2) NOT NULL,
    income_max DECIMAL(10, 2)
  )
`;

  const createStandardDeductionsTable = `
    CREATE TABLE IF NOT EXISTS standard_deductions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      filing_status VARCHAR(20) NOT NULL,
      standard_deduction DECIMAL(10, 0) NOT NULL
    )
  `;

  const createCapitalGainsTaxTable = `
    CREATE TABLE IF NOT EXISTS capital_gains_tax (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      filing_status VARCHAR(20) NOT NULL,
      cap_gains_tax_rate DECIMAL(3, 2) NOT NULL,
      income_min DECIMAL(10, 0) NOT NULL,
      income_max DECIMAL(10, 0)
    )
  `;

  // The highest age in this table will be considered as "that age and up."
  // For example, if 120 is the highest age in the table, it will be considered as ages 120 and up.
  const createRMDsTable = `
    CREATE TABLE IF NOT EXISTS rmds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      year INT NOT NULL,
      age INT NOT NULL,
      distribution_period DECIMAL(10, 1) NOT NULL
    )
  `;

  // need to add this into taxes section
  // inflation_assumption DECIMAL(5, 2),
  // annual_pre_tax_contribution_limit DECIMAL(10, 2),
  // annual_after_tax_contribution_limit DECIMAL(10, 2),

  const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
       id varchar(255) NOT NULL , 
       name varchar(100), 
       lastName varchar(100), 
       email varchar(255), 
       UNIQUE(email), 
       PRIMARY KEY(id));
  `;

  // User scenario info table has user_id which is foreign key to reference the user that owns the scenario
  const createScenariosTable = `
  CREATE TABLE IF NOT EXISTS scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    marital_status ENUM('individual', 'couple') NOT NULL,
    birth_years JSON,
    life_expectancy JSON,
    inflation_assumption JSON,
    after_tax_contribution_limit INT NOT NULL,
    financial_goal DECIMAL(10, 2) NOT NULL,
    residence_state CHAR(2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  `;

  // Create investment type table has scenario ID which references the scenario that the investment type is attached to
  const createInvestmentTypesTable = `
  CREATE TABLE IF NOT EXISTS investment_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    return_distribution JSON,
    return_amt_or_pct ENUM('amount', 'percent'),
    expense_ratio DECIMAL(5, 2),
    income_distribution JSON,
    income_amt_or_pct ENUM('amount', 'percent'),
    taxability BOOL,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
  );
  `;

  const createInvestmentsTable = `
    CREATE TABLE IF NOT EXISTS investments (
      id VARCHAR(255),
      scenario_id INT,
      investment_type VARCHAR(255) NOT NULL,
      value DECIMAL(10, 2) NOT NULL,
      tax_status VARCHAR(255) NOT NULL,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
    );
  `;

  const createEventsTable = `
  CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_id INT,
    name VARCHAR(255),
    description TEXT,
    type VARCHAR(255),
    start JSON,
    duration JSON,
    change_distribution JSON,   
    initial_amount DECIMAL(10, 2),
    change_amt_or_pct VARCHAR(255),
    inflation_adjusted BOOLEAN,
    user_fraction DECIMAL(5, 2),
    social_security BOOLEAN,
    asset_allocation JSON,
    glide_path BOOLEAN,
    asset_allocation2 JSON,
    discretionary BOOLEAN,
    max_cash DECIMAL(10, 2), 
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
  );
`;

  //allocation_type VARCHAR(255) CHECK (allocation_type IN ('fixed', 'glide_path')), <- take a look

  // spending strategy (ordering on discretionary expenses),
  // expense withdrawal strategy (order in which ivestments are sold to generate cash)
  // Roth conversion strategy
  // RMD strategy
  const createStrategyTable = `
    CREATE TABLE IF NOT EXISTS strategy (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scenario_id INT,
      strategy_type VARCHAR(255) NOT NULL,
      start_year INT DEFAULT NULL,
      end_year INT DEFAULT NULL,
      investment_id VARCHAR(255) DEFAULT NULL, -- applies to investment-based strategies
      expense_id INT DEFAULT NULL,    -- applies to spending strategie
      strategy_order INT NOT NULL,    -- indicates the order
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
      FOREIGN KEY (expense_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `;

  // Create tables
  await connection.execute(createTaxBracketsTable);
  await connection.execute(createStateTaxBracketsTable);
  await connection.execute(createStandardDeductionsTable);
  await connection.execute(createCapitalGainsTaxTable);
  await connection.execute(createRMDsTable);
  await connection.execute(createUsersTable);
  await connection.execute(createScenariosTable);
  await connection.execute(createInvestmentsTable);
  await connection.execute(createInvestmentTypesTable);
  await connection.execute(createEventsTable);
  await connection.execute(createStrategyTable);
}
