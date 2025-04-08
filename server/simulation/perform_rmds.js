// Perform the RMD for the previous year, if the user’s age is at least 74 and at the end of the previous
// year, there is at least one investment with tax status = “pre-tax” and with a positive value.
// a. The first RMD is for the year in which the user turns 73, and is paid in the year in which the user
// turns 74.
// b. Distribution period d = result from lookup of the user’s age in the most recent available RMD table
// (typically the current actual year’s RMD table).
// c. s = sum of values of the investments with tax status = pre-tax, as of the end of the previous year.
// (don’t look for “IRA” in the name of the investment type. employer-sponsored pre-tax retirement
// accounts are not IRAs.)
// d. rmd = s / d
// e. curYearIncome += rmd
// f. Iterate over the investments in the RMD strategy in the given order, transferring each of them in-
// kind to an investment with the same investment type and with tax status = “non-retirement”, until
// the total amount transferred equals rmd. The last investment to be transferred might be partially
// transferred.
// g. “Transferring in-kind” means reducing the value of the source investment by the transferred
// amount, checking whether an investment with the same investment type and target tax status
// already exists, and if so, adding the transferred amount to its value, otherwise creating an
// investment with the same investment type, the target tax status, and value equal to the transferred amount.

//import axios from 'axios';


/**
 * Performs the Required Minimum Distribution (RMD) for the previous year.
 * @param {Object} user - The user object containing birth year and other details.
 * @param {number} currentYear - The current simulation year.
 * @param {number} curYearIncome - The current year's income total.
 * @returns {Object} Updated investments and curYearIncome after performing RMDs.
 */
export async function performRMDs(userId, currentSimulationYear, curYearIncome) {


    const userAge = currentYear - user.birthYear;

    // Step a: Check if the user is at least 74 and has pre-tax investments
    if (user.birthYear + 73 != currentSimulationYear) { 
        return; // No RMD required
    }

    let preTaxInvestments; //fetch pre tax investments from db or local storage for guest use
    try {
        const response = await axios.get('http://localhost:3000/pre-tax-investments'); 
        preTaxInvestments = response.data;
    } catch (err) {
        console.error("Failed to fetch pre-tax investments:", err);
        throw new Error("Unable to fetch pre-tax investments from the server.");
    }

    if (preTaxInvestments.length === 0) {
        return; // No pre-tax investments what happens then?
    }

    // Step b: Lookup distribution period (d) from the RMD table
    //not rly sure how to access RMD table should have been scraped...
    const distributionPeriod = rmdTable[userAge - 1]; // Assuming the table is indexed by age
    if (!distributionPeriod) {
        throw new Error(`No distribution period found for age ${userAge}`);
    }

    // Step c: Calculate the sum of pre-tax investment values (s)
    const totalPreTaxValue = preTaxInvestments.reduce((sum, inv) => sum + inv.dollar_value, 0);

    // Step d: Calculate the RMD (rmd = s / d)
    const rmd = totalPreTaxValue / distributionPeriod;

    // Step e: Add RMD to curYearIncome
    curYearIncome += rmd;

    // Step f: Transfer investments in-kind to non-retirement accounts: 
    let remainingRMD = rmd;
    
    try {
        // Start a database transaction
        await connection.beginTransaction();

        for (const inv of preTaxInvestments) {
            if (remainingRMD <= 0) break;

            const transferAmount = Math.min(inv.dollar_value, remainingRMD);
            remainingRMD -= transferAmount;

            // Reduce the value of the source investment
            await connection.execute(
                "UPDATE investments SET dollar_value = dollar_value - ? WHERE id = ?",
                [transferAmount, inv.id]
            );

            // Check if a non-retirement investment with the same type exists
            const [targetRows] = await connection.execute(
                "SELECT * FROM investments WHERE investment_type = ? AND tax_status = 'non-retirement'",
                [inv.investment_type]
            );
            if (targetRows.length > 0) {
                // Add the transferred amount to the existing non-retirement investment
                const targetInvestment = targetRows[0];
                await connection.execute(
                    "UPDATE investments SET dollar_value = dollar_value + ? WHERE id = ?",
                    [transferAmount, targetInvestment.id]
                );
            } else {
                // Create a new non-retirement investment
                await connection.execute(
                    "INSERT INTO investments (investment_type, tax_status, dollar_value) VALUES (?, 'non-retirement', ?)",
                    [inv.investment_type, transferAmount]
                );
            }
        }

        // Commit the transaction
        await connection.commit();
    } catch (err) {
        console.error("Failed to perform RMD transfers:", err);
        // Rollback the transaction in case of an error
        await db.rollback();
        throw new Error("Failed to perform RMD transfers.");
    }



    // Return the updated investments and curYearIncome
    return { curYearIncome };
}

