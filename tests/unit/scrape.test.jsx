import {
  scrapeCapitalGainsTax,
  scrapeRMD,
  scrapeStandardDeductions,
  scrapeTaxBrackets,
} from "../../server/taxes";
import { pool } from "../../server/utils";
import { describe, test, expect, afterAll } from "vitest";

/**
 * TP: ChatGPT, prompt - "i have functions that scrape data about tax brackets, standard deductions,
 * capital gains tax rates, and RMDs from the IRS website. How can I make a test that checks if the scraping works,
 * and the data is present in the database?"
 *
 * "what if i can't use a test database?"
 *
 * "how should this change if i am using a pool of connections"
 */
describe("Scrape and store tax information from IRS website", () => {
  test("Scrapes and stores tax bracket data, then rolls back", async () => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("DELETE FROM tax_brackets");

      // Optionally override the scraper to use this connection
      const brackets = await scrapeTaxBrackets(connection);

      expect(brackets.length).toBeGreaterThan(0);
      expect(brackets[0]).toHaveProperty("year");
      expect(brackets[0]).toHaveProperty("filingStatus");
      expect(brackets[0]).toHaveProperty("taxRate");
      expect(brackets[0]).toHaveProperty("incomeMin");
      expect(brackets[0]).toHaveProperty("incomeMax");

      const [rows] = await connection.query("SELECT * FROM tax_brackets");
      expect(rows.length).toBe(brackets.length);

      await connection.rollback(); // undo the inserts
    } finally {
      connection.release(); // return to the pool
    }
  });
  test("Scrapes and stores standard deductions data, then rolls back", async () => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("DELETE FROM standard_deductions");

      // Optionally override the scraper to use this connection
      const brackets = await scrapeStandardDeductions(connection);

      expect(brackets.length).toBeGreaterThan(0);
      expect(brackets[0]).toHaveProperty("year");
      expect(brackets[0]).toHaveProperty("filingStatus");
      expect(brackets[0]).toHaveProperty("standardDeduction");

      const [rows] = await connection.query(
        "SELECT * FROM standard_deductions"
      );
      expect(rows.length).toBe(brackets.length);

      await connection.rollback(); // undo the inserts
    } finally {
      connection.release(); // return to the pool
    }
  });
  test("Scrapes and stores capital gains tax rate data, then rolls back", async () => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("DELETE FROM capital_gains_tax");

      // Optionally override the scraper to use this connection
      const brackets = await scrapeCapitalGainsTax(connection);

      expect(brackets.length).toBeGreaterThan(0);
      expect(brackets[0]).toHaveProperty("year");
      expect(brackets[0]).toHaveProperty("filingStatus");
      expect(brackets[0]).toHaveProperty("capitalGainsTaxRate");
      expect(brackets[0]).toHaveProperty("incomeMin");
      expect(brackets[0]).toHaveProperty("incomeMax");

      const [rows] = await connection.query("SELECT * FROM capital_gains_tax");
      expect(rows.length).toBe(brackets.length);

      await connection.rollback(); // undo the inserts
    } finally {
      connection.release(); // return to the pool
    }
  });
  test("Scrapes and stores RMD data, then rolls back", async () => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query("DELETE FROM rmds");

      // Optionally override the scraper to use this connection
      const brackets = await scrapeRMD(connection);

      expect(brackets.length).toBeGreaterThan(0);
      expect(brackets[0]).toHaveProperty("year");
      expect(brackets[0]).toHaveProperty("age");
      expect(brackets[0]).toHaveProperty("distribution_period");

      const [rows] = await connection.query("SELECT * FROM rmds");
      expect(rows.length).toBe(brackets.length);

      await connection.rollback(); // undo the inserts
    } finally {
      connection.release(); // return to the pool
    }
  });
});

afterAll(async () => {
  await pool.end();
});
