import fs from 'fs';
import { format } from 'fast-csv';
import { ensureConnection, connection } from "./server.js";


export async function log(userId, simResults) {

    // create logs directory if it doesn't exist
    const dir = 'server/simulation/logs';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Logs directory created:', dir);
    }

    const name = get_user_name(userId);

    const username = name || "Guest"; // uses guest if id not in db
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_') // separates date and time
        .slice(0, 19); // trim off milliseconds and Z

    const path = `${dir}/${username}_${timestamp}.csv`; // do not change quotation type
    const file = fs.createWriteStream(path); // creates/opens file

    // custom write stream
    const csvStream = format({ headers: true }) // with title row
        .on('error', e => console.error(e));

    csvStream.pipe(file); // connect the write stream to the csv file

    try {
        // simResults.forEach(row => csvStream.write(row)); // for array
        // csvStream.write(simResults); // for temp string testing
        csvStream.end();
    } catch(e) {
        console.error("Error writing to CSV log at", path, e);
    }
    
}

/**
 * Fetches the user's name from the database.
 * @param {string} userId - The ID of the user.
 * @returns {string|null} The user's full name if found, or null if the user is not found.
 */
export async function get_user_name(userId) {
    await ensureConnection(); // Ensure the database connection is active

    try {
        const [rows] = await connection.execute(
            `SELECT CONCAT(name, ' ', lastName) AS fullName FROM users WHERE id = ?`,
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
