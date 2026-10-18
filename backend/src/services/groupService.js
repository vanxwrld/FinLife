/**
 * Group Service - Helper functions untuk operasi grup
 * Dipisahkan dari routes agar logic bersama mudah diakses tanpa tight coupling
 */

/**
 * Recalculate dan update total_setoran, total_pengeluaran, dan saldo_grup di tabel `groups`
 * @param {Connection} conn - MySQL connection dari pool
 * @param {number} grupId - ID grup
 * @returns {Object} { totalSetoran, totalPengeluaran, saldoGrup }
 */
async function syncGroupBalance(conn, grupId) {
  const [sumContrib] = await conn.query(
    'SELECT COALESCE(SUM(nominal), 0) AS total FROM contributions WHERE id_grup = ? AND status_data = "aktif"',
    [grupId]
  );
  const [sumExpense] = await conn.query(
    'SELECT COALESCE(SUM(total_nominal), 0) AS total FROM expenses WHERE id_grup = ? AND status_data = "aktif"',
    [grupId]
  );

  const totalSetoran = parseFloat(sumContrib[0].total);
  const totalPengeluaran = parseFloat(sumExpense[0].total);
  const saldoGrup = totalSetoran - totalPengeluaran;

  await conn.query(
    'UPDATE `groups` SET total_setoran = ?, total_pengeluaran = ?, saldo_grup = ? WHERE id = ?',
    [totalSetoran, totalPengeluaran, saldoGrup, grupId]
  );

  return { totalSetoran, totalPengeluaran, saldoGrup };
}

export { syncGroupBalance };
