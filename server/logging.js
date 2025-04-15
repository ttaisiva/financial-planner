import fs from 'fs';
import { format } from 'fast-csv';
import { ensureConnection, connection } from "./server.js";
import { log } from 'console';


export async function initLogs(userId) {

     // create logs directory if it doesn't exist
     const dir = 'server/simulation/logs';
     if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
         console.log('Logs directory created:', dir);
     }
 
     const name = await getUsername(userId);
 
     const username = name || "Guest"; // uses guest if id not in db
     const timestamp = new Date()
         .toISOString()
         .replace(/[:.]/g, '-')
         .replace('T', '_') // separates date and time
         .slice(0, 19); // trim off milliseconds and Z
 
     let path = `${dir}/${username}_${timestamp}.csv`; // do not change quotation type
     const csvlog = fs.createWriteStream(path); // creates/opens file
    //  const csvlog = fs.createWriteStream(path, { flags: 'a' });
     path = `${dir}/${username}_${timestamp}.log`;
     const evtlog = fs.createWriteStream(path, { flags: 'a' });

     const csvStream = format({ headers: false }) // no title row by default
        .on('error', e => console.error(e));    
    csvStream.pipe(csvlog); // connect the write stream to the csv file

     return {csvlog, evtlog, csvStream};

}
export function logResults(csvlog, csvStream, investments, year) {

    // Copilot prompt: this function is called repeatedly so i 
        // want to make sure the title row doesn't get written multiple times, 
        // but that it does get modified if new investments are added
    
    // Check if the title row needs to be updated or written
    if (!csvlog.titleRow || investments.some(investment => 
        !csvlog.titleRow.includes(investment.type + " (" + investment.taxStatus + ")"))) {
        const titleRow = ['Year', ...investments.map(investment => (investment.type + " (" + investment.taxStatus + ")"))];
        csvStream.write(titleRow);
        csvlog.titleRow = titleRow; // Cache the title row in the write stream object
    } 
    // Write the data row
    const dataRow = [year, ...investments.map(investment => investment.value)];
    csvStream.write(dataRow);
}

export async function logEvent(evtlog, event) {
    console.log('event amount in logEvent', event.amount);
    const eventString = 
    `Year: ${event.year}
    Event: ${event.type}
    $${event.amount}\n`;
    evtlog.write(eventString); // Write the event to the log file
}

// event logging below

export function logIncome(evtlog, year, name, currentAmount) {
    const event = {
        year: year,
        type: `Income "${name}"`,
        amount: currentAmount,
    }
    logEvent(evtlog, event);
}

export function logRMD(evtlog, year, inv, transferAmount) {
    const event = {
        year: year,
        type: `RMD tranfer from investment "${inv}".`,
        amount: transferAmount,
    }
    logEvent(evtlog, event);
}


export function logRothConversion(evtlog, year, pretax, aftertax, conversionAmt) {
    const event = {
        year: year,
        type: `Roth conversion from pre-tax investment "${pretax.type}" to after-tax investment "${aftertax.type}"`,
        amount: conversionAmt, 
    }
    console.log('event amount in logRothConversion', event.amount);
    logEvent(evtlog, event);
}


/**
 * Fetches the user's name from the database.
 * @param {string} userId - The ID of the user.
 * @returns {string|null} The user's full name if found, or null if the user is not found.
 */
export async function getUsername(userId) {
    await ensureConnection(); // Ensure the database connection is active

    try {
        const [rows] = await connection.execute(
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
