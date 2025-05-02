import React from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  BarElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register required Chart.js components
ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler);

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
      //console.log(`Year: ${year}, Cash Investment: ${cashInvestment}, Financial Goal: ${financialGoal}`);
      if (cashInvestment >= financialGoal) { // compare with financial goal
        yearlySuccess[year].successCount += 1;
      }
    });
  });

  

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

          if (!yearlyData[year]) {
            yearlyData[year] = [];
          }

          if (selectedOption !== "discExpenses"){
            console.log("NOT DISCRETIONARY EXPENSES: ", yearlyResult[selectedOption]);
            const value = yearlyResult[selectedOption]; // e.g., cashInvestment, curYearIncome, etc.

            if (selectedOption === "expenses") {
              // Add taxes for each year to the yearly expenses
              console.log("Adding taxes to yearly expenses: ", yearlyResult.taxes);
              yearlyData[year].push(Number(yearlyResult.taxes));
            }

            yearlyData[year].push(value);
          }
          // need to do extra because we dont have that specific option in simulationResults
          // Calculate the percentage of discretionary expenses incurred for the year
          else {
            console.log("DISCRETIONARY EXPENSES: ", yearlyResult.actualDiscExpenses, yearlyResult.expenses);
            const incurred = yearlyResult.actualDiscExpenses || 0; // Amount of discretionary expenses incurred
            //const desired = yearlyResult.expenses.filter((expense) => expense.discretionary === 1) || 1;
            const desired = yearlyResult.expenses
              .filter((expense) => expense.discretionary === 1)
              .reduce((sum, expense) => Number(sum) + Number(expense.initialAmount), 0) || 1; // Sum initial amounts of discretionary expenses
            const percentage = (incurred / desired) * 100; // Calculate percentage
            console.log(`Year: ${year}, Incurred: ${incurred}, Desired: ${desired}, Percentage: ${percentage}`);
            yearlyData[year].push(percentage);
          }

        });
      });
      
      return yearlyData;
    };
    
    const yearlyData = generateDataByYear(allSimulationResults, label);
   
    const median = [];
    const p10 = [], p90 = [];
    const p20 = [], p80 = [];
    const p30 = [], p70 = [];
    const p40 = [], p60 = [];
    const labels = Object.keys(yearlyData).map((year) => Number(year));
    
    labels.forEach((year) => {
        const values = yearlyData[year];
        values.sort((a, b) => a - b);
      
        const n = values.length;
      
        // Median (50th percentile)
        median.push(values[Math.floor(n * 0.5)]);
      
        // 10–90% range
        p10.push(values[Math.floor(n * 0.1)]);
        p90.push(values[Math.floor(n * 0.9)]);
      
        // 20–80% range
        p20.push(values[Math.floor(n * 0.2)]);
        p80.push(values[Math.floor(n * 0.8)]);
      
        // 30–70% range
        p30.push(values[Math.floor(n * 0.3)]);
        p70.push(values[Math.floor(n * 0.7)]);
      
        // 40–60% range
        p40.push(values[Math.floor(n * 0.4)]);
        p60.push(values[Math.floor(n * 0.6)]);
    });

    const data = {
        labels: labels,
        datasets: [
          {
            label: '10-90%',
            data: p90,
            fill: '-1',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            data: p10,
            fill: false,
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            label: '20–80%',
            data: p80,
            fill: '-1',
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            data: p20,
            fill: false,
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            label: '30–70%',
            data: p70,
            fill: '-1',
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            data: p30,
            fill: false,
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            label: '40–60%',
            data: p60,
            fill: '-1',
            backgroundColor: 'rgba(0, 0, 255, 0.3)',
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            data: p40,
            fill: false,
            borderWidth: 0,
            pointRadius: 0,
          },
          {
            label: 'Median',
            data: median,
            borderColor: 'red',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
          }
        ]
      };
      
      const options = {
        responsive: true,
        scales: {
          y: {
            title: {
              display: true,
              text: label
            },
            beginAtZero: false
          },
          x: {
            title: {
              display: true,
              text: 'Year'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      };


    return <Line data={data} options={options} />;
}

export function StackedBarChart({ allSimulationResults, breakdownType, aggregationThreshold, useMedian }) {
  //Helper function to calculate median or average

  const calculateValue = (values, useMedian) => {
    const sorted = [...values].sort((a, b) => a - b);  // Make a shallow copy before sorting
  
    if (useMedian) {
      return sorted[Math.floor(sorted.length * 0.5)];
    }
  
    return sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
  };
  
  const processData = (simulationResults, breakdownType, useMedian) => {
    
    const yearlyData = {};

    console.log("Simulation Results before yearly: ", simulationResults); //they're already all the same here....
    simulationResults.forEach((simulation) => {
      simulation.forEach((yearlyResult) => {
        const year = yearlyResult.year;

        if (!yearlyData[year]) {
          yearlyData[year] = {};
        }
        console.log("Yearly Result: ", yearlyResult);
        if (breakdownType === "investments") {
          yearlyResult.investments.forEach(({ id, value }) => {
           
            if (!yearlyData[year][id]) {
              yearlyData[year][id] = [];
            }
            yearlyData[year][id].push(value);
          });
        } else if (breakdownType === "income") {
          console.log("INCOME STACKED BAR CHART: ", yearlyResult.incomes)
          yearlyResult.incomes.forEach(({ name, initialAmount }) => {
            if (!yearlyData[year][name]) {
              yearlyData[year][name] = [];
            }
            yearlyData[year][name].push(initialAmount);
          });
        } else if (breakdownType === "expenses") {
          console.log("EXPENSES STACKED BAR CHART: ", yearlyResult.expenses)
          yearlyResult.expenses.forEach(({ name, initialAmount }) => {
            if (!yearlyData[year][name]) {
              yearlyData[year][name] = [];
            }
            yearlyData[year][name].push(initialAmount);
          });
          if (!yearlyData[year]["Taxes"]) {
            yearlyData[year]["Taxes"] = [];
          }
          console.log("Taxes: ", yearlyResult.taxes)
          yearlyData[year]["Taxes"].push(yearlyResult.taxes);
        }
      });
    });

    // determine median/avg
    const processed = {};
    console.log("Plot yearlyData: ", yearlyData);
    Object.entries(yearlyData).forEach(([year, categories]) => {
      processed[year] = {};
      Object.entries(categories).forEach(([category, values]) => {
        processed[year][category] = calculateValue(values, useMedian);
      });
    });

    return processed;
  };

  // 1.) group the data by year and category: handle the different breakdown tyeps, apply median/avg
  const processedData = processData(allSimulationResults, breakdownType, useMedian);


  // 2.) Apply aggregation thershold and move investments below aggregation threshold into category "other"
  const aggregatedData = {};
  const allCategories = new Set();

  Object.values(processedData).forEach((categories) => {
    Object.keys(categories).forEach((category) => {
      allCategories.add(category);
    });
  });

  Object.entries(processedData).forEach(([year, categories]) => {
    aggregatedData[year] = {};
    Object.entries(categories).forEach(([category, value]) => {
      if (value >= aggregationThreshold) {
        aggregatedData[year][category] = Number(value);

      } else {

        console.log(`Category ${category} with value ${value} is below aggregation threshold of ${aggregationThreshold}. Moving to "Other".`);

        if (!aggregatedData[year]["Other"]) {
          aggregatedData[year]["Other"] = 0;
          allCategories.add("Other");
        }
        aggregatedData[year]["Other"] += Number(value);
      }
    });
  });

  console.log("All Categories:"); //TODO: Some categories seem to be nonexistend
  allCategories.forEach((category) => {
    console.log(category);
  });

  

  // 3.) Preprocess data for plot: I need my data to look like this:
  const labels = Object.keys(aggregatedData).map((year) => Number(year));
  const datasets = Array.from(allCategories).map((category) => ({
    label: category,
    data: labels.map((year) => aggregatedData[year]?.[category] || 0),
    backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255
    )}, 0.5)`, // Random color for each category
  }));

  console.log("Datasets: ", datasets)
  const data = {
    labels,
    datasets,
  }

  console.log("Data: ", data)
  // 4.) Plot the data using chart.js

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const dataset = tooltipItem.dataset;
            const value = dataset.data[tooltipItem.dataIndex];
            return `${dataset.label}: ${value}`;
          },
        },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Year",
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: breakdownType,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;

}