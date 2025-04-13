export async function testConnectToDatabase() {
  console.log("DB_HOST:", process.env.DB_HOST);
  const connection = await mysql.createConnection({
    host: process.env.TEST_HOST,
    user: process.env.TEST_USER,
    password: process.env.TEST_PASS,
    database: process.env.TEST_NAME,
    port: process.env.TEST_PORT,
  });
  console.log("Database connection established.");
  return connection;
}
