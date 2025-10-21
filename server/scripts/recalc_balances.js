const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

(async () => {
  try {
    await recalculateAllAccountBalances();
    console.log('Recalculation finished successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Recalculation failed:', e);
    process.exit(1);
  }
})();


