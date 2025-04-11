

export async function payDiscExpenses(scenarioId) {

    // discretionary: optional expenses in strategy order
    const [rows] = await connection.execute(
        `SELECT 
            id,
            expense_id,
            strategy_order,
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'spendingStrat'`,
        [scenarioId]
    );

}