// a. Calculate the generated income, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// b. Add the income to curYearIncome, if the investment’s tax status is ‘non-retirement’ and the
// investment type’s taxability is ‘taxable’. (For investments in pre-tax retirement accounts, the income
// is taxable in the year it is withdrawn from the account. For investments in after-tax retirement
// accounts, the income is not taxable.)
// c. Add the income to the value of the investment. 
// d. Calculate the change in value, using the given fixed amount or percentage, or sampling from the
// specified probability distribution.
// e. Calculate this year’s expenses, by multiplying the expense ratio and the average value of the
// investment (i.e., the average of its value at the beginning and end of the year). Subtract the
// expenses from the value.

/**
 * Updates investments for the current year.
 * @param {Array} investments - The list of investments.
 * @param {Object} investmentTypes - The investment types with taxability and other details.
 * @param {number} curYearIncome - The current year's income total.
 * @returns {Object} Updated investments and curYearIncome.
 */
export function updateInvestments() {
    
}

