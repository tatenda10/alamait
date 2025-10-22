const credits = [
  { name: 'Rumbidzai Manyaora', amount: -2.00 },
  { name: 'Bertha Majoni', amount: -10.00 },
  { name: 'Leona Dengu', amount: -20.00 },
  { name: 'Emma Yoradin', amount: -20.00 },
  { name: 'Ropafadzo Masara', amount: -30.00 },
  { name: 'Shalom Gora', amount: -35.00 },
  { name: 'Chantelle Gora', amount: -35.00 },
  { name: 'Fadzai Mhizha', amount: -61.00 },
  { name: 'Varaidzo Tafirei', amount: -70.00 },
  { name: 'Dion sengamai', amount: -80.00 },
  { name: 'Kudzai Pemhiwa', amount: -240.00 }
];

console.log('💳 STUDENTS WITH CREDIT BALANCES:');
console.log('='.repeat(50));

let total = 0;
credits.forEach(student => {
  const absAmount = Math.abs(student.amount);
  total += absAmount;
  console.log(`${student.name}: $${absAmount.toFixed(2)}`);
});

console.log('='.repeat(50));
console.log(`TOTAL CREDIT: $${total.toFixed(2)}`);
console.log(`Number of students with credit: ${credits.length}`);
