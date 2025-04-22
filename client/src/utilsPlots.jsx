import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

/**
 * Line chart to display success probabilities over time.
 * @param {Array} successProbabilities - Array of objects with year and successProbability.
 */
export function LineChart({ successProbabilities }) {
    {/* Copilot: plot a line chart using chart.js for the successProbabilities*/}
  const data = {
    labels: successProbabilities.map((entry) => entry.year), // X-axis labels (years)
    datasets: [
      {
        label: "Success Probability (%)",
        data: successProbabilities.map((entry) => entry.successProbability), // Y-axis data
        borderColor: "rgba(75, 192, 192, 1)", // Line color
        backgroundColor: "rgba(75, 192, 192, 0.2)", // Fill color under the line
        fill: true,
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Year",
        },
      },
      y: {
        title: {
          display: true,
          text: "Success Probability (%)",
        },
        min: 0,
        max: 100,
      },
    },
  };

  return <Line data={data} options={options} />;
}

/**
 * Calculates the probability of success for each year based on simulation results.
 * @param {Array} allSimulationResults - Array of simulations, where each simulation is an array of yearly results.
 * @param {number} financialGoal - The financial goal to be satisfied.
 * @returns {Array} An array of objects, each containing the year and the success probability for that year.
 */
export function calculateSuccessProbability(allSimulationResults, financialGoal) {
  const yearlySuccess = {};

  // Iterate through all simulations
  allSimulationResults.forEach((simulation) => {
    simulation.forEach((yearlyResult) => {
      const year = yearlyResult.year; 
      const cashInvestment = yearlyResult.cashInvestment;  

      // initialize the year in the yearlySuccess object if it doesn't exist
      if (!yearlySuccess[year]) {
        yearlySuccess[year] = { successCount: 0, totalCount: 0 };
      }

      // Increment the total count for the year
      yearlySuccess[year].totalCount += 1;
      console.log(`Year: ${year}, Cash Investment: ${cashInvestment}, Financial Goal: ${financialGoal}`);
      if (cashInvestment >= financialGoal) { // compare with financial goal
        yearlySuccess[year].successCount += 1;
      }
    });
  });

  console.log("yearlySuccess: ", yearlySuccess);

  // Calculate success probability for each year
  return Object.entries(yearlySuccess).map(([year, { successCount, totalCount }]) => ({
    year: Number(year),
    successProbability: (successCount / totalCount) * 100, // Convert to percentage
  }));
}