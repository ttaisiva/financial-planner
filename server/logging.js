import fs from "fs";
import { format } from "fast-csv";
import { log } from "console";
import { pool } from "./utils.js";

export async function initLogs(userId) {
  // create logs directory if it doesn't exist
  const dir = "server/simulation/logs";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Logs directory created:", dir);
  }

  const name = await getUsername(userId);

  const username = name || "Guest"; // uses guest if id not in db
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_") // separates date and time
    .slice(0, 19); // trim off milliseconds and Z

  let path = `${dir}/${username}_${timestamp}.csv`; // do not change quotation type
  const csvlog = fs.createWriteStream(path); // creates/opens file
  //  const csvlog = fs.createWriteStream(path, { flags: 'a' });
  path = `${dir}/${username}_${timestamp}.log`;
  const evtlog = fs.createWriteStream(path, { flags: "a" });

  const csvStream = format({ headers: false }) // no title row by default
    .on("error", (e) => console.error(e));
  csvStream.pipe(csvlog); // connect the write stream to the csv file

  return { csvlog, evtlog, csvStream };
}
export function logResults(csvlog, csvStream, investments, year) {

  // Initialize allInvestments if not present
  if (!csvlog.allInvestments) {
    csvlog.allInvestments = [];
  }

  // Update allInvestments with any new ones
  for (const inv of investments) {
    const label = inv.type + " (" + inv.taxStatus + ")";
    if (!csvlog.allInvestments.includes(label)) {
      csvlog.allInvestments.push(label);
    }
  }

  // Only write the title row once
  if (!csvlog.headerWritten) {
    const titleRow = ["Year", ...csvlog.allInvestments];
    csvStream.write(titleRow);
    csvlog.headerWritten = true;
  }

  // Create a map from label to value
  const investmentMap = Object.fromEntries(
    investments.map((inv) => [
      inv.type + " (" + inv.taxStatus + ")",
      Math.round(inv.value * 100) / 100,
    ])
  );

  // Write data row with all known investments (fill in blanks if missing)
  const dataRow = [
    year,
    ...csvlog.allInvestments.map((label) =>
      investmentMap[label] !== undefined ? investmentMap[label] : ""
    ),
  ];
  csvStream.write(dataRow);
}


export async function logEvent(evtlog, event) {
  console.log("event amount in logEvent", event.amount);
  const eventString = `Year: ${event.year}
    Event: ${event.type}
    $${event.amount.toFixed(2)}\n\n`;
  evtlog.write(eventString); // Write the event to the log file
}

// event logging below

export function logIncome(evtlog, year, name, currentAmount) {
  const event = {
    year: year,
    type: `Income "${name}"`,
    amount: currentAmount,
  };
  logEvent(evtlog, event);
}

export function logExpense(evtlog, year, name, amount, investment) {
  const event = {
    year: year,
    type: `Expense "${name}" deducted from investment "${investment}"`,
    amount: amount,
  };
  logEvent(evtlog, event);
}
// TODO: not called
export function logInvest(evtlog, year, name, amount, investment) {
  const event = {
    year: year,
    type: `Invest "${name}" into investment "${investment}"`,
    amount: amount,
  };
  logEvent(evtlog, event);
}

export function logRebalance(evtlog, year, name, amount, investmentId) {
  const event = {
    year: year,
    type: `Rebalance "${name}" applied to investment "${investmentId}"`,
    amount: amount,
  };
  logEvent(evtlog, event);
}


export function logRMD(evtlog, year, inv, transferAmount) {
  const event = {
    year: year,
    type: `RMD tranfer from investment "${inv}".`,
    amount: transferAmount,
  };
  logEvent(evtlog, event);
}

export function logRothConversion(
  evtlog,
  year,
  pretax,
  aftertax,
  conversionAmt
) {
  const event = {
    year: year,
    type: `Roth conversion from pre-tax investment "${pretax.type}" to after-tax investment "${aftertax.type}"`,
    amount: conversionAmt,
  };
  console.log("event amount in logRothConversion", event.amount);
  logEvent(evtlog, event);
}

/**
 * Fetches the user's name from the database.
 * @param {string} userId - The ID of the user.
 * @returns {string|null} The user's full name if found, or null if the user is not found.
 */
export async function getUsername(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT CONCAT(name, '-', lastName) AS fullName FROM users WHERE id = ?`,
      [userId]
    );

    // If no user is found, return null
    if (rows.length === 0) {
      return null;
    }

    // Return the full name directly
    return rows[0].fullName || null;
  } catch (error) {
    console.error(`Error fetching user name for ID ${userId}:`, error);
    throw new Error("Failed to fetch user name from the database.");
  }
}
