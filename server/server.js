import dotenv from "dotenv";
import path from "path";
// this is for sophie pls dont delete otherwise my env wont work
dotenv.config({ path: path.resolve("../.env") }); 
import mysql from "mysql2/promise";
import express from "express";
import session from "express-session";
import cors from "cors";
import { scrapeData } from "./scraping.js";


dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5175'],
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


let connection;
async function connectToDatabase() {
  //console.log("DB_HOST:", process.env.DB_HOST);
    connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  console.log("Database connection established.");
  return connection;
}

export async function ensureConnection() {
  if (!connection || connection.connection._closing) { //If connection is gone or closing
    console.log("Reconnecting to the database...");
    await connectToDatabase();
  }
}

startServer();

async function startServer() {
  try {
    await connectToDatabase();
    const g = await scrapeData();
  } catch (err) {
    console.error("Error:", err.message);
    throw err;
  }
}

const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import authRouter from "./routers/authentication.js";
app.use("/auth", authRouter);

import scenarioRouter from "./routers/scenario_endpoints.js";
app.use("/api", scenarioRouter);

export { connectToDatabase, connection };
