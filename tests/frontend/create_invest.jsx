import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  Investment,
  ViewInvestmentDetails,
} from "../../client/src/components/InvestmentDetails";

describe("Investment", () => {
  it("Display the investment type, value, and tax status of the created investment on the page", async () => {
    // Mock state for investments
    let investments = [];
    const setInvestments = (newInvestments) => {
      investments = newInvestments;

      // Re-render the components with updated investments
      rerender(
        <>
          <Investment
            investments={investments}
            setInvestments={setInvestments}
            setShowInvestmentForm={vi.fn()}
            investmentTypes={[{ name: "Stocks" }, { name: "Bonds" }]} // Mock investment types
          />
          <ViewInvestmentDetails
            investments={investments}
            investmentTypes={[]}
          />
        </>
      );
    };

    // Render the Investment and ViewInvestmentDetails components
    const { rerender } = render(
      <>
        <Investment
          investments={investments}
          setInvestments={setInvestments}
          setShowInvestmentForm={vi.fn()}
          investmentTypes={[{ name: "Stocks" }, { name: "Bonds" }]} // Mock investment types
        />
        <ViewInvestmentDetails investments={investments} investmentTypes={[]} />
      </>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Investment Type:"), {
      target: { value: "Stocks" },
    });
    fireEvent.change(screen.getByLabelText("Dollar Amount:"), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText("Taxability:"), {
      target: { value: "pre-tax" },
    });

    // Submit the form
    fireEvent.click(screen.getByText("Save"));

    // Simulate adding the investment to the investments array
    setInvestments([
      ...investments,
      {
        investmentType: "Stocks",
        value: 1000,
        taxStatus: "pre-tax",
      },
    ]);

    // Wait for the DOM to update
    await waitFor(() => {
      expect(screen.getByText("Stocks")).toBeInTheDocument();
      expect(screen.getByText("$1000")).toBeInTheDocument();
      expect(screen.getByText("(pre-tax)")).toBeInTheDocument();
    });
  });
});
