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

const axios = require('axios');

/**
 * Performs the Required Minimum Distribution (RMD) for the previous year.
 * @param {Object} user - The user object containing birth year and other details.
 * @param {number} currentYear - The current simulation year.
 * @param {number} curYearIncome - The current year's income total.
 * @returns {Object} Updated investments and curYearIncome after performing RMDs.
 */
async function performRMDs(user, currentSimulationYear, curYearIncome) {
    const userAge = currentYear - user.birthYear;

    // Step a: Check if the user is at least 74 and has pre-tax investments
    if (user.birthYear + 73 != currentSimulationYear) {
        return; // No RMD required
    }

    let preTaxInvestments;
    try {
        const response = await axios.get('http://localhost:3000/pre-tax-investments'); // Replace with your server's URL
        preTaxInvestments = response.data;
    } catch (err) {
        console.error("Failed to fetch pre-tax investments:", err);
        throw new Error("Unable to fetch pre-tax investments from the server.");
    }

    if (preTaxInvestments.length === 0) {
        return; // No pre-tax investments
    }

    // Step b: Lookup distribution period (d) from the RMD table
    //not rly sure how to access RMD table 
    const distributionPeriod = rmdTable[userAge - 1]; // Assuming the table is indexed by age
    if (!distributionPeriod) {
        throw new Error(`No distribution period found for age ${userAge}`);
    }

    // Step c: Calculate the sum of pre-tax investment values (s)
    const totalPreTaxValue = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);

    // Step d: Calculate the RMD (rmd = s / d)
    const rmd = totalPreTaxValue / distributionPeriod;

    // Step e: Add RMD to curYearIncome
    curYearIncome += rmd;

    // Step f: Transfer investments in-kind to non-retirement accounts
    let remainingRMD = rmd;
    const updatedInvestments = investments.map((inv) => {
        if (remainingRMD > 0 && inv.taxStatus === "pre-tax") {
            const transferAmount = Math.min(inv.value, remainingRMD);
            inv.value -= transferAmount; // Reduce the value of the source investment
            remainingRMD -= transferAmount;

            // Check if a non-retirement investment with the same type exists
            const targetInvestment = investments.find(
                (targetInv) =>
                    targetInv.investmentType === inv.investmentType &&
                    targetInv.taxStatus === "non-retirement"
            );

            if (targetInvestment) {
                // Add the transferred amount to the existing non-retirement investment
                targetInvestment.value += transferAmount;
            } else {
                // Create a new non-retirement investment
                investments.push({
                    investmentType: inv.investmentType,
                    taxStatus: "non-retirement",
                    value: transferAmount,
                });
            }
        }
        return inv;
    });

    // Return the updated investments and curYearIncome
    return { investments: updatedInvestments, curYearIncome };
}

module.exports = { performRMDs };