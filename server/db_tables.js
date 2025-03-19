export async function createTablesIfNotExist(connection) {
  const createInvestmentsTable = `
    CREATE TABLE IF NOT EXISTS investments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      investment_type VARCHAR(255) NOT NULL,
      dollar_value DECIMAL(10, 2) NOT NULL,
      tax_status VARCHAR(255) NOT NULL
    );
  `;

  const createInvestmentTypesTable = `
    CREATE TABLE IF NOT EXISTS investment_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      expAnnReturnType VARCHAR(255),
      expAnnReturnValue DECIMAL(10, 2),
      expenseRatio DECIMAL(5, 2),
      expAnnIncomeType VARCHAR(255),
      expAnnIncomeValue DECIMAL(10, 2),
      taxability VARCHAR(255)
    );
  `;

  await connection.execute(createInvestmentsTable);
  await connection.execute(createInvestmentTypesTable);
}