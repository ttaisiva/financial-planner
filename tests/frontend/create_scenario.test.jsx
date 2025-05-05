/**
 * TP: GitHub CoPilot, prompt - "make test(s) for creating a scenario"
 * @jest-environment jsdom
 */
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import NewScenarioPage from "../../client/src/pages/NewScenarioPage";
import { MemoryRouter } from "react-router-dom";

// Mocks
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../client/src/utils", async () => {
  const actual = await vi.importActual("../../client/src/utils");
  return {
    ...actual,
    loadAnimation: vi.fn(),
    handleFileUpload: vi.fn(),
  };
});

vi.mock("react-tooltip", () => ({
  Tooltip: () => null,
  ReactTooltip: () => null,
}));

describe("NewScenarioPage", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scenario_id: "12345" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Submits scenario data and navigates", async () => {
    render(
      <MemoryRouter>
        <NewScenarioPage />
      </MemoryRouter>
    );

    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
      target: { value: "Test Scenario" },
    });
    fireEvent.change(screen.getByLabelText(/Financial goal/i), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText(/Choose your state/i), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByLabelText(/Filing Status:/i), {
      target: { value: "individual" },
    });
    fireEvent.change(screen.getByLabelText(/Inflation Assumption/i), {
      target: { value: "fixed" },
    });
    fireEvent.change(screen.getByLabelText(/After-Tax Contribution Limit/i), {
      target: { value: "10000" },
    });
    fireEvent.change(screen.getByLabelText(/Your birth year:/i), {
      target: { value: "1990" },
    });
    fireEvent.change(screen.getByLabelText(/Your life expectancy/i), {
      target: { value: "fixed" },
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Save Scenario/i }));
    });

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/create-scenario",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Object),
        body: expect.any(String),
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/scenario/12345");
  });
});
