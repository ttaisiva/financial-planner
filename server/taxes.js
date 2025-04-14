import mysql from "mysql2/promise";
import * as cheerio from "cheerio";
import yaml from "js-yaml";
import fs from "fs";
import { connectToDatabase } from "./server.js";

async function scrapeData() {
  scrapeTaxBrackets();
  scrapeStandardDeductions();
  scrapeCapitalGainsTax();
  scrapeRMD();
  insertStateTaxBrackets();
}

/**
 * Scrapes IRS website for tax rates and tax bracket information and inserts it into the database.
 *
 * taxBrackets [ {year, filingStatus, taxRate, incomeMin, incomeMax} ]
 *
 * @returns
 * TP: ChatGPT, prompt: "how do i scrape specifically tax rates and brackets for single and marid jointly"
 */
var taxBrackets = [];
async function scrapeTaxBrackets() {
  const $ = await cheerio.fromURL(
    "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets"
  );

  let year;

  $("h2").each((_, element) => {
    // Get year from IRS site to check if year is already in database
    const content = $(element).text().trim();
    if (content.includes("single")) year = extractYear(content);
  });

  if (await isTaxBracketYearInDB(year)) {
    // If year already in database, don't scrape and exit out of this function
    console.log(
      `Tax bracket data for ${year} already in database. Scrape canceled.`
    );
    return;
  }

  let currFilingStatus = "";

  $("h2, table, a").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "h2" && content.includes("single")) {
      // If tag and content match this, the table tag after this will contain tax bracket info for filing single
      currFilingStatus = "single";
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
            incomeMax = null;
          }

          taxBrackets.push({
            year: year,
            filingStatus: currFilingStatus, // Single or married (jointly implicit)
            taxRate: taxRate, // Float, ex: 0.1
            incomeMin: incomeMin, // Int
            incomeMax: incomeMax, // Int or null
          });
        });
      if (currFilingStatus == "married") currFilingStatus = ""; // Change to "" so that no tax rate information is scraped after "married jointly"
    }
  });
  insertTaxBrackets(taxBrackets);
}

/**
 * Checks if tax bracket information for the year present in the IRS website is already present in the database
 *
 * @param {int} year
 * @returns boolean
 */
async function isTaxBracketYearInDB(year) {
  try {
    const connection = await connectToDatabase();
    const sql = "SELECT year FROM tax_brackets WHERE year=?";
    const params = [year];

    const [rows] = await connection.execute(sql, params);

    await connection.end();

    if (rows.length == 0) {
      console.log(
        `Tax bracket data for ${year} NOT found in database. Continue scraping.`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Inserts tax bracket information into the database.
 *
 * @param {*} taxBrackets
 */
async function insertTaxBrackets(taxBrackets) {
  try {
    const connection = await connectToDatabase();
    const sql =
      "INSERT INTO `tax_brackets`(`year`, `filing_status`, `tax_rate`, `income_min`, `income_max`) VALUES (?, ?, ?, ?, ?)";

    taxBrackets.forEach((element) => {
      const values = Object.values(element);
      connection.execute(sql, values);
    });

    await connection.end();
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Scrapes IRS website for standard deduction information and inserts it into the database.
 *
 * standardDeductions [ {year, filingStatus, standardDeduction} ]
 *
 * @returns
 */
var standardDeductions = [];
async function scrapeStandardDeductions() {
  const $ = await cheerio.fromURL("https://www.irs.gov/publications/p17");

  let isCorrectTable = false;

  let year = extractYear($("title").text().trim());

  if (await isStandardDeductYearInDB(year)) {
    // If year already in database, don't scrape and exit out of this function
    console.log(
      `Standard deductions data for ${year} already in database. Scrape canceled.`
    );
    return;
  }

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
  insertStandardDeductions(standardDeductions);
}

/**
 * Checks if standard deduction information for the year present in the IRS website is already present in the database
 *
 * @param {int} year
 * @returns boolean
 */
async function isStandardDeductYearInDB(year) {
  try {
    const connection = await connectToDatabase();
    const sql = "SELECT year FROM standard_deductions WHERE year=?";
    const params = [year];

    const [rows] = await connection.execute(sql, params);

    await connection.end();

    if (rows.length == 0) {
      console.log(
        `Standard deduction data for ${year} NOT found in database. Continue scraping.`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Inserts standard deduction information into the database.
 *
 * @param {*} taxBrackets
 */
async function insertStandardDeductions(standardDeductions) {
  try {
    const connection = await connectToDatabase();
    const sql =
      "INSERT INTO `standard_deductions`(`year`, `filing_status`, `standard_deduction`) VALUES (?, ?, ?)";

    standardDeductions.forEach((element) => {
      const values = Object.values(element);
      connection.execute(sql, values);
    });

    await connection.end();
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Scrapes IRS website for capital gains tax rate information and inserts it into the database.
 *
 * capitalGainsTaxRates [ {year, filingStatus, capitalGainsTaxRate, incomeMin, incomeMax} ]
 *
 * @returns
 */
var capitalGainsTaxRates = [];
async function scrapeCapitalGainsTax() {
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
  });

  if (await isCapitalGainsYearInDB(year)) {
    // If year already in database, don't scrape and exit out of this function
    console.log(
      `Capital gains tax rate data for ${year} already in database. Scrape canceled.`
    );
    return;
  }

  counter = 0; // Reset counter
  isCorrectList = false; // Reset boolean

  $("h2, p, b, ul").each((_, element) => {
    const tag = $(element).prop("tagName").toLowerCase();
    const content = $(element).text().trim();

    if (tag === "h2" && content.includes("Capital gains tax rates")) {
      // If tag and content match this, <p> and <ul> after this will contain capital gains tax info
      isCorrectList = true;
    }

    if (tag === "p" && isCorrectList) {
      counter += 1; // The next 2 <p> tags after the correct h2 tag will contain the capital gains tax rate. Counter keeps track
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
            // If first list on IRS site, single and married have the same rate, same min, but different maxes
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
            // If second list on IRS site, single and married have the same rate, but different min and maxes
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
  insertCapitalGains(capitalGainsTaxRates);
}

/**
 * Checks if capital gains tax rate information for the year present in the IRS website is already present in the database
 *
 * @param {int} year
 * @returns boolean
 */
async function isCapitalGainsYearInDB(year) {
  try {
    const connection = await connectToDatabase();
    const sql = "SELECT year FROM capital_gains_tax WHERE year=?";
    const params = [year];

    const [rows] = await connection.execute(sql, params);

    await connection.end();

    if (rows.length == 0) {
      console.log(
        `Capital gains tax rate data for ${year} NOT found in database. Continue scraping.`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Inserts capital gains tax rate information into the database.
 *
 * @param {*} taxBrackets
 */
async function insertCapitalGains(capitalGainsTaxRates) {
  try {
    const connection = await connectToDatabase();
    const sql =
      "INSERT INTO `capital_gains_tax`(`year`, `filing_status`, `cap_gains_tax_rate`, `income_min`, `income_max`) VALUES (?, ?, ?, ?, ?)";

    capitalGainsTaxRates.forEach((element) => {
      const values = Object.values(element);
      connection.execute(sql, values);
    });

    await connection.end();
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

var RMDs = [];
async function scrapeRMD() {
  const $ = await cheerio.fromURL("https://www.irs.gov/publications/p590b");

  let year = extractYear($("title").text().trim());

  if (await isRMDYearInDB(year)) {
    // If year already in database, don't scrape and exit out of this function
    console.log(`RMD data for ${year} already in database. Scrape canceled.`);
    return;
  }

  $("table").each((_, element) => {
    // Scrape RMD data
    const tag = $(element).prop("tagName").toLowerCase();
    const summary = $(element).attr("summary");

    if (tag === "table" && summary === "Appendix B. Uniform Lifetime Table") {
      $(element)
        .find("tr")
        .each((i, row) => {
          // Rows 5 through 29 in this table contain the data for RMDs
          if (i > 4 && i < 30) {
            const columns = $(row).find("td");
            const age1 = $(columns[0]).text().trim();
            const distPeriod1 = $(columns[1]).text().trim();
            const age2 = $(columns[2]).text().trim();
            const distPeriod2 = $(columns[3]).text().trim();

            // Age may be listed as "[int] and over", and if so, the age will be stored as the [int] listed in the string,
            // and will be considered as 120 and over implicitly
            if (age1) {
              if (age1.includes("and over")) {
                const newAge = extractInt(age1);
                RMDs.push({
                  year: year,
                  age: newAge,
                  distribution_period: distPeriod1,
                });
                console.log("new age", newage);
              } else {
                RMDs.push({
                  year: year,
                  age: age1,
                  distribution_period: distPeriod1,
                });
              }
            }

            // Age may be listed as "[int] and over", and if so, the age will be stored as the [int] listed in the string,
            // and will be considered as 120 and over implicitly
            if (age2) {
              if (age2.includes("and over")) {
                const newAge = extractInt(age2);
                RMDs.push({
                  year: year,
                  age: newAge,
                  distribution_period: distPeriod2,
                });
              } else {
                RMDs.push({
                  year: year,
                  age: age2,
                  distribution_period: distPeriod2,
                });
              }
            }
          }
        });
    }
  });
  insertRMDs(RMDs);
}

/**
 * Checks if RMD information for the year present in the IRS website is already present in the database
 *
 * @param {int} year
 */
async function isRMDYearInDB(year) {
  try {
    const connection = await connectToDatabase();
    const sql = "SELECT year FROM rmds WHERE year=?";
    const params = [year];

    const [rows] = await connection.execute(sql, params);

    await connection.end();

    if (rows.length == 0) {
      console.log(
        `RMD data for ${year} NOT found in database. Continue scraping.`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Inserts RMD information into the database.
 *
 * @param {*} RMDs
 */
async function insertRMDs(RMDs) {
  try {
    const connection = await connectToDatabase();
    const sql =
      "INSERT INTO `rmds`(`year`, `age`, `distribution_period`) VALUES (?, ?, ?)";

    RMDs.forEach((element) => {
      const values = Object.values(element);
      connection.execute(sql, values);
    });

    await connection.end();
  } catch (err) {
    console.error("Database error:", err.message);
    throw err;
  }
}

/**
 * Inserts State Tax Brackets from the statetax.yaml file in the data folder if it is not already in DB
 */
async function insertStateTaxBrackets() {
  const connection = await connectToDatabase();
  const [isAdded] = await connection.execute(`SELECT * FROM state_tax_brackets WHERE user_id IS NULL`); // Indicates that the pre-written state tax brackets were added; All other tax brackets are uploaded by users
  if (isAdded.length == 0) {
    const states = yaml.load(fs.readFileSync('data/statetax.yaml', 'utf8'));
    const query = `
    INSERT INTO state_tax_brackets (state, user_id, year, filing_status, tax_rate, income_min, income_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    for (const state of states) {
      for (const bracket of state[Object.keys(state)[0]]) {
        const values = [
          Object.keys(state)[0],
          null,
          bracket.year,
          bracket.filing_status,
          bracket.rate,
          bracket.income_min,
          bracket.income_max
        ];
        await connection.execute(query, values);
      }
    }
  }
}

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
 * Returns all extractions of a string that consist of digits that are preceded by '$' and may have commas within it followed by 3 digits intervals
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

function extractInt(text) {
  let match = text.match(/\d+/);
  return match ? match[0] : null;
}

export { scrapeData };
