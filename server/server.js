import dotenv from "dotenv";
dotenv.config(); // loads environment variables from .env
import mysql from "mysql2";

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

console.log("DB Name:", process.env.DB_NAME);

connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    // throw err;
  } else {
    console.log("Connected to MySQL!");
  }
});


app.post('/api/investments', (req, res) => {
  const { investment_type, dollar_value, tax_status } = req.body;

  const query = 'INSERT INTO investments (investment_type, dollar_value, tax_status) VALUES (?, ?, ?)';
  const values = [investment_type, dollar_value, tax_status];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Failed to insert investment:', err);
      res.status(500).send('Failed to save investment');
    } else {
      res.status(201).send('Investment saved successfully');
    }
  });
});


app.post('/api/investment-types', (req, res) => {
  const { name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability } = req.body;

  const query = 'INSERT INTO investment_types (name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error('Failed to insert investment type:', err);
      res.status(500).send('Failed to save investment type');
    } else {
      res.status(201).send('Investment type saved successfully');
    }
  });
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
