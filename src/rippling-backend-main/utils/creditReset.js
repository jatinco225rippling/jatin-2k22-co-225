// Handles monthly reset for sending credits with up to 50 carry-forward
function ensureMonthlyReset(user) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

  if (user.lastResetMonth === currentMonth) {
    return false; // no change
  }

  const carryForward = Math.min(user.sendBalance, 50);
  const oldSendBalance = user.sendBalance;

  user.sendBalance = 100 + carryForward;
  user.monthlySent = 0;
  user.lastResetMonth = currentMonth;

  console.log(
    `[CREDITS] Monthly reset for user=${user.email} oldSendBalance=${oldSendBalance} carryForward=${carryForward} newSendBalance=${user.sendBalance}`
  );

  return true; // changed
}

module.exports = { ensureMonthlyReset };
