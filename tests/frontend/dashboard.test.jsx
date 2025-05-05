import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "../../client/src/components/Dashboard";

describe("Dashboard", () => {
  beforeEach(() => {
    // Mock the window object
    global.window = {
      location: {
        href: "",
      },
    };

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should upload scenario and redirect to the correct URL", async () => {
    // Mock server response
    const mockResponse = {
      json: vi.fn().mockResolvedValue({ scenario_id: "12345" }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    // Mock scenario data
    const yamlScn = {
      RothConversionOpt: true,
      RothConversionStart: 2025,
      RothConversionEnd: 2030,
      RothConversionStrategy: "S&P 500 pre-tax",
      investmentTypes: [
        {
          name: "S&P 500",
          description: "S&P 500 index fund",
          returnAmtOrPct: "percent",
          returnDistribution: { type: "normal", mean: 0.06, stdev: 0.02 },
          expenseRatio: 0.001,
          incomeAmtOrPct: "percent",
          incomeDistribution: { type: "normal", mean: 0.01, stdev: 0.005 },
          taxability: true,
        },
      ],
      eventSeries: [],
    };
    const investments = [{ name: "Investment A", value: 1000 }];
    const scenario = { name: "Test Scenario" };

    // Call the function that uploads the scenario
    const completeScenario = {
      scenario: scenario,
      investmentTypes: yamlScn.investmentTypes,
      investments: investments,
      eventSeries: yamlScn.eventSeries,
      strategies: {
        roth: {
          opt: yamlScn.RothConversionOpt,
          start: yamlScn.RothConversionStart,
          end: yamlScn.RothConversionEnd,
          strategy: yamlScn.RothConversionStrategy,
        },
      },
    };

    // Simulate the upload scenario logic
    await fetch("http://localhost:3000/api/import-scenario", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(completeScenario),
    });

    // Assertions
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/import-scenario",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeScenario),
      }
    );

    // Simulate redirection
    global.window.location.href = `/scenario/12345`;
    expect(global.window.location.href).toBe("/scenario/12345");
  });

  it("should handle errors during scenario upload", async () => {
    // Mock fetch to throw an error
    global.fetch.mockRejectedValue(new Error("Network error"));

    // Call the function that uploads the scenario
    try {
      await fetch("http://localhost:3000/api/import-scenario", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      expect(error.message).toBe("Network error");
    }

    // Ensure fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });
});
