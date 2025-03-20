import dotenv from "dotenv";
import mysql from "mysql2/promise";
import * as cheerio from "cheerio";
import express from "express";
import session from "express-session";
import cors from "cors";
import { scrapeData } from "./scraping.js";

dotenv.config(); // loads environment variables from .env

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(session({
  secret: "key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false,
    secure: false,
    maxAge: 24*60*60*1000,
  }
}))

startServer();

async function startServer() {
  try {
    const g = await scrapeData();
  } catch (err) {
    console.error("Error:", err.message);
    throw err;
  }
}

async function connectToDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  return connection;
}

app.post("/api/investments", (req, res) => {
  const { investment_type, dollar_value, tax_status } = req.body;

  const query =
    "INSERT INTO investments (investment_type, dollar_value, tax_status) VALUES (?, ?, ?)";
  const values = [investment_type, dollar_value, tax_status];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error("Failed to insert investment:", err);
      res.status(500).send("Failed to save investment");
    } else {
      res.status(201).send("Investment saved successfully");
    }
  });
});

app.post("/api/investment-types", (req, res) => {
  const {
    name,
    description,
    expAnnReturnType,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    taxability,
  } = req.body;

  const query =
    "INSERT INTO investment_types (name, description, expAnnReturnType, expAnnReturnValue, expenseRatio, expAnnIncomeType, expAnnIncomeValue, taxability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  const values = [
    name,
    description,
    expAnnReturnType,
    expAnnReturnValue,
    expenseRatio,
    expAnnIncomeType,
    expAnnIncomeValue,
    taxability,
  ];

  connection.query(query, values, (err, results) => {
    if (err) {
      console.error("Failed to insert investment type:", err);
      res.status(500).send("Failed to save investment type");
    } else {
      res.status(201).send("Investment type saved successfully");
    }
  });
});

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import authRouter from "./routers/authentication.js";
app.use("/auth", authRouter);

export { connectToDatabase };
