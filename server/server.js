import dotenv from "dotenv";
dotenv.config(); // loads environment variables from .env
import mysql from "mysql2";
import * as cheerio from "cheerio";

import express from "express";
import session from "express-session";
import cors from "cors";

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

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
    throw err;
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


/**
 * taxBrackets [ {year, filingStatus, taxRate, incomeMin, incomeMax} ]
 * TP: ChatGPT, prompt: "how do i scrape specifically tax rates and brackets for single and marid jointly"
 */
var taxBrackets = [];
const scrapeTaxBrackets = async () => {
  const $ = await cheerio.fromURL(
    "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets"
  );

  let currFilingStatus = "";
  let year;

  $("h2, table, a").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "h2" && content.includes("single")) {
      // If tag and content match this, the table tag after this will contain tax bracket info for filing single
      currFilingStatus = "single";
      year = extractYear(content);
    } else if (tag === "a" && content.includes("Married filing jointly")) {
      // If tag and content match this, the table tag after this will contain tax bracket info for filing married jointly
      currFilingStatus = "married";
    } else if (
      tag === "table" &&
      (currFilingStatus == "single" || currFilingStatus == "married")
    ) {
      // Only scrape tax bracket info for single and married jointly
      $(element)
        .find("tr")
        .each((i, row) => {
          if (i === 0) return; // Skip header row

          const columns = $(row).find("td");
          let taxRate = percentageToDecimal($(columns[0]).text().trim());
          let incomeMin = moneyToInt($(columns[1]).text().trim());
          let incomeMax = moneyToInt($(columns[2]).text().trim());

          if (isNaN(incomeMax)) {
            // If tax bracket is the highest possible, IRS website lists "And up" for the max income, thus the incomeMax is infinity
            incomeMax = Infinity;
          }

          taxBrackets.push({
            year: year,
            filingStatus: currFilingStatus, // Single or married (jointly implicit)
            taxRate: taxRate, // Float, ex: 0.1
            incomeMin: incomeMin, // Int
            incomeMax: incomeMax, // Int or Infinity
          });
        });
      if (currFilingStatus == "married") currFilingStatus = ""; // Change to "" so that no tax rate information is scraped after "married jointly"
    }
  });
};

/**
 * standardDeductions [ {year, filingStatus, standardDeduction} ]
 */
var standardDeductions = [];
const scrapeStandardDeductions = async () => {
  const $ = await cheerio.fromURL("https://www.irs.gov/publications/p17");

  let isCorrectTable = false;

  let year = extractYear($("title").text().trim());

  $("p, table").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "p" && content.includes("Table 10-1.Standard Deduction Chart"))
      // If tag and content match this, the table tag after this will contain standard deduction info
      isCorrectTable = true;

    if (tag === "table" && isCorrectTable) {
      // Only scrape standard deductions for single and married jointly
      $(element)
        .find("tr")
        .each((i, row) => {
          if (i === 0) return; // Skip header row

          const columns = $(row).find("td");
          if ($(columns[0]).text().trim().includes("Single")) {
            standardDeductions.push({
              year: year,
              filingStatus: "single",
              standardDeduction: moneyToInt($(columns[1]).text().trim()),
            });
          } else if ($(columns[0]).text().trim().includes("Married")) {
            standardDeductions.push({
              year: year,
              filingStatus: "married",
              standardDeduction: moneyToInt($(columns[1]).text().trim()),
            });
          }
        });
      isCorrectTable = false; // Set to False again so that no more tables are scraped after this
    }
  });
};

/**
 * capitalGainsTaxRates [ {year, filingStatus, capitalGainsTaxRate, incomeMin, incomeMax} ]
 */
var capitalGainsTaxRates = [];
const scrapeCapitalGainsTax = async () => {
  const $ = await cheerio.fromURL("https://www.irs.gov/taxtopics/tc409");

  let isCorrectList = false;
  let year;
  let currFilingStatus;
  let currCapitalGainsRate = 0.0;
  let incomeMin;
  let incomeMax;

  // If 0, then correct list not reached.
  // If 1, then 1st type of capital gains tax list reached.
  // If 2, then 2nd type of capital gains tax list reached.
  let counter = 0;

  $("h2, p, b, ul").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "h2" && content.includes("Capital gains tax rates")) {
      // If tag and content match this, <p> and <ul> after this will contain capital gains tax info
      isCorrectList = true;
    }

    if (tag === "p" && isCorrectList) {
      counter += 1; // The next 2 <p> tags after the correct h2 tag will contain the capital gains tax rate. Counter keeps track
      if (counter === 1) {
        year = extractYear(content);
      }
    }

    if (tag === "b" && isCorrectList) {
      // Capital gains tax rate is within the <b> tag right before the next <ul>
      currCapitalGainsRate = percentageToDecimal(extractPercentage(content));
    }

    if (tag === "ul" && isCorrectList) {
      // Only capital gains for single and married jointly
      $(element)
        .find("li")
        .each((i, item) => {
          if (counter === 1) {
            // If first list, single and married have the same rate, same min, but different maxes
            if (i === 0) {
              currFilingStatus = "single";
              incomeMin = 0;
              incomeMax = moneyToInt(extractMoney($(item).text().trim()));
            } else if (i === 1) {
              currFilingStatus = "married";
              incomeMin = 0;
              incomeMax = moneyToInt(extractMoney($(item).text().trim()));
            }
          } else if (counter === 2) {
            // If second list, single and married have the same rate, but different min and maxes
            if (i === 0) {
              currFilingStatus = "single";
              incomeMin = moneyToInt(extractAllMoney($(item).text().trim())[0]);
              incomeMax = moneyToInt(extractAllMoney($(item).text().trim())[1]);
            } else if (i === 1) {
              currFilingStatus = "married";
              incomeMin = moneyToInt(extractAllMoney($(item).text().trim())[0]);
              incomeMax = moneyToInt(extractAllMoney($(item).text().trim())[1]);
              isCorrectList = false; // Set to False again so that no more lists are scraped after this
            }
          }
          if ((counter === 1 || counter === 2) && (i === 0 || i === 1)) {
            // If correct list items, then push
            capitalGainsTaxRates.push({
              year: year,
              filingStatus: currFilingStatus,
              capitalGainsTaxRate: currCapitalGainsRate,
              incomeMin: incomeMin,
              incomeMax: incomeMax,
            });
            if (!isCorrectList) counter += 1; // Stop anymore pushes after list is done
          }
        });
    }
  });
};

/**
 *
 * @param {String} text
 * @returns Float
 * TP: ChatGPT, prompt - "convert percentage in text into decimal number"
 */
function percentageToDecimal(text) {
  return parseFloat(text.replace("%", "")) / 100; // Removes "%" from string and converts to Float
}

/**
 *
 * @param {String} text
 * @returns Int
 * TP: ChatGPT, prompt - "how to replace both "," and "$"
 */
function moneyToInt(text) {
  return parseInt(text.replace(/[$,]/g, ""), 10); // Removes "$" and "," from string and converts to Int
}

/**
 *
 * @param {String} text
 * @returns String
 * TP: ChatGPT, prompt - "how to extract string of money out of a string like "i have $4000"""
 */
function extractPercentage(text) {
  let match = text.match(/\d+%/); // Looks for one or more digits followed by '%'
  return match ? match[0] : null;
}

/**
 *
 * @param {String} text
 * @returns String
 * TP: ChatGPT, prompt - "how to check if a string has a "%" in it, and if it does,get the percentage part of the string.
 *    for example, if the string is "the percentage is 15% today", then get "15%""
 */
function extractMoney(text) {
  let match = text.match(/\$\d+(?:,\d{3})*/); // Looks for digit starting with dollar sign and can have commas or decimals
  return match ? match[0] : null;
}

/**
 *
 * @param {String} text
 * @returns Array
 * TP: ChatGPT, prompt - "does this work if there are two instances in one string? ex: "I have $4000 and she has $3000""
 */
function extractAllMoney(text) {
  let matches = text.matchAll(/\$\d+(?:,\d{3})*/g);
  return Array.from(matches, (match) => match[0]);
}

function extractYear(text) {
  let match = text.match(/(?:\d{4})/);
  return match ? match[0] : null;
}

scrapeTaxBrackets();
scrapeStandardDeductions();
scrapeCapitalGainsTax();

// const insertTaxBrackets = (year, filingStatus, incomeMin, incomeMax, taxRate) => {
//   const sql = "INSERT INTO tax_brackets (year, filingStatus, incomeMin, incomeMax, taxRate) VALUES ?";
//   const values =
// }
import authRouter from './routers/authentication.js';

app.use("/auth", authRouter);