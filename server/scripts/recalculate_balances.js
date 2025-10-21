const { recalculateAllAccountBalances } = require('../src/services/accountBalanceService');

async function main() {
  try {
    console.log('Recalculating all account balances...');
    await recalculateAllAccountBalances();
    console.log('✅ All account balances recalculated successfully!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Recalculation failed:', e);
    process.exit(1);
  }
}

main();
