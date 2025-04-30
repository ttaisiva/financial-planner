import { connection } from "../server.js";
import { ensureConnection } from "../server.js";
import { getFilingStatus } from "./monte_carlo_sim.js";
import { logRothConversion } from "../logging.js";

export async function runRothOptimizer(
  scenarioId,
  rothStrategy,
  incomeEvents,
  year,
  evtlog,
  runningTotals,
) {
  let conversionAmt = await getMaxConversionAmt(scenarioId, incomeEvents);

  for (let i = 0; i < rothStrategy.length; i++) {
    if (conversionAmt === 0) break;

    let pretax = runningTotals.investments.find(
      (investment) => investment.id === rothStrategy[i].investment_id
    );

    if (pretax.value <= conversionAmt) {
      conversionAmt -= pretax.value;
      pretax.taxStatus = "after-tax";
      logRothConversion(evtlog, year, pretax, pretax, pretax.value);
      rothStrategy = rothStrategy.filter(
        (strategy) => strategy.investment_id !== pretax.id
      );
    } else {
      let aftertax = runningTotals.investments.find(
        (investment) =>
          investment.type === pretax.type &&
          investment.taxStatus === "after-tax"
      );
      if (aftertax) {
        aftertax.value += conversionAmt;
        pretax.value -= conversionAmt;

        logRothConversion(evtlog, year, pretax, aftertax, conversionAmt);
      } else {
        const newInvestment = {
          id: pretax.type + " after-tax",
          type: pretax.type,
          taxStatus: "after-tax",
          value: conversionAmt,
        };
        runningTotals.investments.push(newInvestment);

        logRothConversion(evtlog, year, pretax, pretax, conversionAmt);
      }
      conversionAmt = 0;
    }
  }

  let resInvestment = runningTotals.investments;
  return { resInvestment, rothStrategy };
}

async function getMaxConversionAmt(scenarioId, incomeEvents) {
  let totalIncome = 0;
  for (let i = 0; i < incomeEvents.length; i++) {
    totalIncome += incomeEvents[i].currentAmount;
  }
  const filingStatus = await getFilingStatus(scenarioId);
  const taxBrackets = await getTaxBrackets(filingStatus);

  let userMax;
  try {
    userMax = taxBrackets[0].incomeMax;
  } catch {
    console.error("Couldn't extract income max from tax brackets.");
    return 0;
  }
  for (let i = 0; i < taxBrackets.length; i++) {
    if (totalIncome <= taxBrackets[i].incomeMax) {
      userMax = taxBrackets[i].incomeMax;
      break;
    }
  }
  return userMax - totalIncome;
}

async function getTaxBrackets(filingStatus) {
  if(filingStatus==='individual') filingStatus='single';
  if(filingStatus==='couple') filingStatus='married';

  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT 
            income_max as incomeMax
         FROM tax_brackets
         WHERE filing_status = ?`,
    [filingStatus]
  );
  return rows;
}

export async function getRothStrategy(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT 
            id,
            investment_id,
            strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'roth'`,
    [scenarioId]
  );
  return rows;
}

export async function getRothYears(scenarioId) {
  await ensureConnection();
  const [rows] = await connection.execute(
    `SELECT
            start_year,
            end_year
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'roth'
         LIMIT 1`,
    [scenarioId]
  );
  return rows[0];
}
