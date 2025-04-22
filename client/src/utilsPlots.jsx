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


export function ShadedLineChart({ label, allSimulationResults, financialGoal }) {
    // Helper function to process simulationResults and generate dataByYear
    const generateDataByYear = (simulationResults, selectedOption) => {
      const yearlyData = {};
  
      // Iterate through all simulations
      simulationResults.forEach((simulation) => {
        simulation.forEach((yearlyResult) => {
          const year = yearlyResult.year;
          const value = yearlyResult[selectedOption]; // e.g., cashInvestment, curYearIncome, etc.
  
          if (!yearlyData[year]) {
            yearlyData[year] = [];
          }
  
          yearlyData[year].push(value);
        });
      });

      console.log("yearlyData: ", yearlyData);
  
      // Calculate percentiles and median for each year
      return Object.entries(yearlyData).map(([year, values]) => {
        values.sort((a, b) => a - b); // Sort values to calculate percentiles
        const p10 = values[Math.floor(values.length * 0.1)];
        const p90 = values[Math.floor(values.length * 0.9)];
        const p20 = values[Math.floor(values.length * 0.2)];
        const p80 = values[Math.floor(values.length * 0.8)];
        const p30 = values[Math.floor(values.length * 0.3)];
        const p70 = values[Math.floor(values.length * 0.7)];
        const p40 = values[Math.floor(values.length * 0.4)];
        const p60 = values[Math.floor(values.length * 0.6)];
        const median = values[Math.floor(values.length * 0.5)];
  
        return {
          year: Number(year),
          median,
          p10,
          p90,
          p20,
          p80,
          p30,
          p70,
          p40,
          p60,
        };
      });
    };


  
    // Generate dataByYear from allSimulationResults and the selected label
    const dataByYear = generateDataByYear(allSimulationResults, label);
  
    // Extract data for the chart
    const labels = dataByYear.map((entry) => entry.year); // X-axis labels (years)
    const median = dataByYear.map((entry) => entry.median);
    const range10_90 = dataByYear.map((entry) => [entry.p10, entry.p90]);
    const range20_80 = dataByYear.map((entry) => [entry.p20, entry.p80]);
    const range30_70 = dataByYear.map((entry) => [entry.p30, entry.p70]);
    const range40_60 = dataByYear.map((entry) => [entry.p40, entry.p60]);
  
    console.log("median: ", median);
    console.log("range10_90: ", range10_90);    
    console.log("range20_80: ", range20_80);
    console.log("range30_70: ", range30_70);
    console.log("range40_60: ", range40_60);
    
    const data = {
      labels,
      datasets: [
        {
          label: `${label} (Median)`,
          data: median,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: false,
          tension: 0.4,
        },
        {
          label: "10%-90% Range",
          data: range10_90.map(([low, high]) => (low + high) / 2),
          borderColor: "rgba(135, 206, 250, 0.5)",
          backgroundColor: "rgba(135, 206, 250, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "20%-80% Range",
          data: range20_80.map(([low, high]) => (low + high) / 2),
          borderColor: "rgba(100, 149, 237, 0.5)",
          backgroundColor: "rgba(100, 149, 237, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "30%-70% Range",
          data: range30_70.map(([low, high]) => (low + high) / 2),
          borderColor: "rgba(70, 130, 180, 0.5)",
          backgroundColor: "rgba(70, 130, 180, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "40%-60% Range",
          data: range40_60.map(([low, high]) => (low + high) / 2),
          borderColor: "rgba(30, 144, 255, 0.5)",
          backgroundColor: "rgba(30, 144, 255, 0.2)",
          fill: true,
          tension: 0.4,
        },
        ...(label === "cashInvestment" && financialGoal
          ? [
            
              {
                label: "Financial Goal",
                data: Array(labels.length).fill(financialGoal),
                borderColor: "rgba(255, 99, 132, 1)",
                borderDash: [5, 5],
                fill: false,
                tension: 0,
              },
            ]
          : []),
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
            text: label,
          },
        },
      },
    };
  
    return <Line data={data} options={options} />;
  }

