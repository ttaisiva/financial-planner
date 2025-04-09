import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mysql from "mysql2/promise";
import { scrapeData } from "../server/scraping.js";
import { connectToDatabase } from "../server.js";
import { startServer } from "../server/server.js";

vi.mock("mysql2/promise");
vi.mock("../server/server.js", () => ({
  connectToDatabase: vi.fn(),
}));

describe("scrapeData function", () => {
  let mockConnection;
  let executeMock;

  beforeEach(() => {
    executeMock = vi.fn();

    mockConnection = {
      execute: executeMock,
      end: vi.fn(),
    };

    connectToDatabase.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should insert scraped tax bracket data into the database", async () => {
    executeMock.mockResolvedValueOnce([]); // Mock isTaxBracketYearInDB to return no existing data

    await scrapeData();

    expect(executeMock).toHaveBeenCalledWith(
      "INSERT INTO `tax_brackets`(`year`, `filing_status`, `tax_rate`, `income_min`, `income_max`) VALUES (?, ?, ?, ?, ?)",
      expect.any(Array)
    );
  });

  it("should insert scraped standard deduction data into the database", async () => {
    executeMock.mockResolvedValueOnce([]); // Mock isStandardDeductYearInDB to return no existing data

    await scrapeData();

    expect(executeMock).toHaveBeenCalledWith(
      "INSERT INTO `standard_deductions`(`year`, `filing_status`, `standard_deduction`) VALUES (?, ?, ?)",
      expect.any(Array)
    );
  });

  it("should insert scraped capital gains tax data into the database", async () => {
    executeMock.mockResolvedValueOnce([]); // Mock isCapitalGainsYearInDB to return no existing data

    await scrapeData();

    expect(executeMock).toHaveBeenCalledWith(
      "INSERT INTO `capital_gains_tax`(`year`, `filing_status`, `cap_gains_tax_rate`, `income_min`, `income_max`) VALUES (?, ?, ?, ?, ?)",
      expect.any(Array)
    );
  });

  it("should not insert tax bracket data if it already exists in the database", async () => {
    executeMock.mockResolvedValueOnce([{ year: 2024 }]); // Mock year already existing

    await scrapeData();

    expect(executeMock).not.toHaveBeenCalledWith(
      "INSERT INTO `tax_brackets`(`year`, `filing_status`, `tax_rate`, `income_min`, `income_max`) VALUES (?, ?, ?, ?, ?)",
      expect.any(Array)
    );
  });
});
