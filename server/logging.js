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

    // const [names] = await connection.execute(
    //     `SELECT 
    //         name,
    //         lastName,
    //     FROM users
    //     WHERE id = ?`,
    //     [userId]
    // );

    const username = names[0]?.name + names[0]?.lastName || "Guest"; // uses guest if id not in db
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
        csvStream.write(simResults); // for temp string testing
        csvStream.end();
    } catch(e) {
        console.error("Error writing to CSV log at", path, e);
    }
    
}
