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
