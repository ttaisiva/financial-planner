export async function createTablesIfNotExist(connection) {
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
  const createUserScenarioInfoTable = `
  CREATE TABLE IF NOT EXISTS user_scenario_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    financial_goal DECIMAL(10, 2) NOT NULL,
    filing_status VARCHAR(255) NOT NULL,
    state_of_residence VARCHAR(255),
    user_life_expectancy_type VARCHAR(255),
    user_life_expectancy_value DECIMAL(10, 2),
    user_life_expectancy_mean DECIMAL(10, 2),
    user_life_expectancy_std_dev DECIMAL(10, 2),
    user_retirement_age_type VARCHAR(255),
    user_retirement_age_value DECIMAL(10, 2),
    user_retirement_age_mean DECIMAL(10, 2),
    user_retirement_age_std_dev DECIMAL(10, 2),
    spouse_life_expectancy_type VARCHAR(255),
    spouse_life_expectancy_value DECIMAL(10, 2),
    spouse_life_expectancy_mean DECIMAL(10, 2),
    spouse_life_expectancy_std_dev DECIMAL(10, 2),
    spouse_retirement_age_type VARCHAR(255),
    spouse_retirement_age_value DECIMAL(10, 2),
    spouse_retirement_age_mean DECIMAL(10, 2),
    spouse_retirement_age_std_dev DECIMAL(10, 2),
    inflation_assumption_type VARCHAR(255),
    inflation_assumption_value DECIMAL(10, 2),
    inflation_assumption_mean DECIMAL(10, 2),
    inflation_assumption_stdev DECIMAL(10, 2),
    inflation_assumption_lower DECIMAL(10, 2),
    inflation_assumption_upper DECIMAL(10, 2),
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
    expAnnReturnType VARCHAR(255),
    expAnnReturnValue DECIMAL(10, 2),
    expAnnReturnMean DECIMAL(10, 2),
    expAnnReturnStdDev DECIMAL(10, 2),
    expAnnReturnTypeAmtOrPct ENUM('amount', 'percent'),
    expenseRatio DECIMAL(5, 2),
    expAnnIncomeType VARCHAR(255),
    expAnnIncomeValue DECIMAL(10, 2),
    expAnnIncomeMean DECIMAL(10, 2),
    expAnnIncomeStdDev DECIMAL(10, 2),
    expAnnIncomeTypeAmtOrPct ENUM('amount', 'percent'),
    taxability VARCHAR(255),
    FOREIGN KEY (scenario_id) REFERENCES user_scenario_info(id) ON DELETE CASCADE
  );
`;

  const createInvestmentsTable = `
    CREATE TABLE IF NOT EXISTS investments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scenario_id INT,
      investment_type VARCHAR(255) NOT NULL,
      dollar_value DECIMAL(10, 2) NOT NULL,
      tax_status VARCHAR(255) NOT NULL,
      FOREIGN KEY (scenario_id) REFERENCES user_scenario_info(id) ON DELETE CASCADE
    );
  `;

  const createEventsTable = `
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scenario_id INT,
      name VARCHAR(255),
      description TEXT,
      event_type VARCHAR(255),
      start_type VARCHAR(255),
      start_value DECIMAL(10, 2),
      start_mean DECIMAL(10, 2),
      start_std_dev DECIMAL(10, 2),
      start_lower DECIMAL(10, 2),
      start_upper DECIMAL(10, 2),
      start_series_start BOOLEAN,
      start_series_end BOOLEAN,
      duration_type VARCHAR(255),
      duration_value DECIMAL(10, 2),
      duration_mean DECIMAL(10, 2),
      duration_std_dev DECIMAL(10, 2),
      duration_lower DECIMAL(10, 2),
      duration_upper DECIMAL(10, 2),
      annual_change_type VARCHAR(255),
      annual_change_value DECIMAL(10, 2),
      annual_change_type_amt_or_pct ENUM('amount', 'percent'),
      annual_change_mean DECIMAL(10, 2),
      annual_change_std_dev DECIMAL(10, 2),
      annual_change_lower DECIMAL(10, 2),
      annual_change_upper DECIMAL(10, 2),      
      initial_amount DECIMAL(10, 2),
      inflation_adjusted BOOLEAN,
      user_percentage DECIMAL(5, 2),
      spouse_percentage DECIMAL(5, 2),
      is_social_security BOOLEAN,
      asset_allocation VARCHAR(255),
      discretionary BOOLEAN,
      max_cash DECIMAL(10, 2), 
      FOREIGN KEY (scenario_id) REFERENCES user_scenario_info(id) ON DELETE CASCADE
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
      investment_id INT DEFAULT NULL, -- applies to investment-based strategies
      expense_id INT DEFAULT NULL,    -- applies to spending strategie
      strategy_order INT NOT NULL,    -- indicates the order
      FOREIGN KEY (scenario_id) REFERENCES user_scenario_info(id),
      FOREIGN KEY (investment_id) REFERENCES investments(id),
      FOREIGN KEY (expense_id) REFERENCES events(id)
    );
  `;

  // Create tables
  await connection.execute(createTaxBracketsTable);
  await connection.execute(createStandardDeductionsTable);
  await connection.execute(createCapitalGainsTaxTable);
  await connection.execute(createUsersTable);
  await connection.execute(createUserScenarioInfoTable);
  await connection.execute(createInvestmentsTable);
  await connection.execute(createInvestmentTypesTable);
  await connection.execute(createEventsTable);
  await connection.execute(createStrategyTable);
}
