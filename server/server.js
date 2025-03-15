import dotenv from "dotenv";
dotenv.config(); // loads environment variables from .env
import mysql from "mysql2";
import * as cheerio from "cheerio";

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

const scrapeTaxBrackets = async () => {
  const $ = await cheerio.fromURL(
    "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets"
  );

  let taxBrackets = [];
  let currFilingStatus = "";

  $("h2, table, a").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "h2" && content.includes("single")) {
      // If tag and content match this, the table tag after this will contain tax bracket info for filing single
      currFilingStatus = "single";
    }
    if (tag === "a" && content.includes("Married filing jointly")) {
      // If tag and content match this, the table tag after this will contain tax bracket info for filing married jointly
      currFilingStatus = "married";
    }
    if (
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
          let incomeMin = removeDollarSign($(columns[1]).text().trim());
          let incomeMax = removeDollarSign($(columns[2]).text().trim());

          if (isNaN(incomeMax)) {
            // If tax bracket is the highest possible, IRS website lists "And up" for the max income, thus the incomeMax is infinity
            incomeMax = Infinity;
          }

          taxBrackets.push({
            filingStatus: currFilingStatus, // single or married (jointly implicit)
            taxRate: taxRate, // float, ex: 0.1
            incomeMin: incomeMin, // int
            incomeMax: incomeMax, // int or Infinity
          });
        });
    }
  });

  console.log(taxBrackets);
};

scrapeTaxBrackets();

function percentageToDecimal(text) {
  return parseFloat(text.replace("%", "")) / 100;
}

function removeDollarSign(text) {
  return parseFloat(text.replace(/[$,]/g, ""), 10);
}

// const insertTaxBrackets = (year, filingStatus, incomeMin, incomeMax, taxRate) => {
//   const sql = "INSERT INTO tax_brackets (year, filingStatus, incomeMin, incomeMax, taxRate) VALUES ?";
//   const values =
// }
