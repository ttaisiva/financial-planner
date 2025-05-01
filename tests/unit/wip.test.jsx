import { scrapeTaxBrackets } from "../src/scraper/taxBrackets";
import { scrapeTaxBrackets } from "../../server/taxes";
import { pool } from "../../server/utils";
import { describe, test, expect } from "vitest";

// describe('scrapeTaxBrackets with pool', () => {
//   test('scrapes and inserts data, then rolls back', async () => {
//     try {
//       await connection.beginTransaction();

//       // Optionally override the scraper to use this connection
//       const brackets = await scrapeTaxBrackets(connection);

//       expect(brackets.length).toBeGreaterThan(0);
//       expect(brackets[0]).toHaveProperty('rate');

//       const [rows] = await connection.query('SELECT * FROM tax_brackets');
//       expect(rows.length).toBe(brackets.length);

//       await connection.rollback(); // undo the inserts
//     } finally {
//       connection.release(); // return to the pool
//     }
//   });
// });
