import dotenv from "dotenv";
import path from "path";
import { createTablesIfNotExist } from "./db_tables.js";
import { pool } from "./utils.js";

dotenv.config({ path: path.resolve("../.env") }); // this is for sophie pls dont delete otherwise my env wont work

import mysql from "mysql2/promise";
import express from "express";
import session from "express-session";
import cors from "cors";
import { scrapeData } from "./taxes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5175"],
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

startServer();

async function startServer() {
  try {
    console.log("host: ", process.env.DB_HOST);
    console.log("user: ", process.env.DB_USER);
    console.log("port: ", process.env.DB_PORT);

    await createTablesIfNotExist();
    await scrapeData();
    console.log("Scraping completed.");
    console.log("All tables created or already exist.");
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

import scenarioRouter from "./routers/scenario.js";
app.use("/api", scenarioRouter);

import userRouter from "./routers/user.js";
app.use("/user", userRouter);
