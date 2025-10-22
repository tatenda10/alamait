// Calculate payment totals from the image data

// PAYMENT 1 column amounts to exclude (51 payments totaling $8,641.00)
const payment1Amounts = [
  100.00, 180.00, 390.00, 200.00, 298.00, 200.00, 180.00, 298.00, 200.00, 220.00,
  215.00, 180.00, 50.00, 50.00, 50.00, 40.00, 80.00, 100.00, 200.00, 50.00,
  50.00, 190.00, 120.00, 95.00, 48.00, 180.00, 50.00, 50.00, 215.00, 200.00,
  180.00, 300.00, 110.00, 153.00, 360.00, 180.00, 250.00, 50.00, 50.00, 180.00,
  160.00, 49.00, 60.00, 100.00, 180.00, 100.00, 180.00, 500.00, 180.00, 640.00,
  200.00
];

// Payments to be INCLUDED (42 payments from PAYMENT 2, PAYMENT 3, PAYMENT 4 columns)
const paymentData = [
  { name: "Trypheane Chinembiri", amount: 180.00, room: "M5" },
  { name: "Anita Gwenda", amount: 140.00, room: "M4" },
  { name: "Lillian Chatikobo", amount: 20.00, room: "M1" },
  { name: "Bellis Mapetere", amount: 180.00, room: "M8" },
  { name: "Bertha Mwangu", amount: 130.00, room: "Up 2" },
  { name: "Merrylin Makunzva", amount: 180.00, room: "C1" },
  { name: "Shantell Mawarira", amount: 150.00, room: "M3" },
  { name: "Salina Saidi", amount: 170.00, room: "Exclusive" },
  { name: "Tinotenda Bwangangwanyo", amount: 120.00, room: "M5" },
  { name: "Kimberly Nkomo", amount: 80.00, room: "M6" },
  { name: "Alicia Mutamuko", amount: 150.00, room: "M7" },
  { name: "Tawana Kuwana", amount: 187.00, room: "Ext 2" },
  { name: "Lorraine Mlambo", amount: 70.00, room: "M1" },
  { name: "Tinotenda Magiga", amount: 100.00, room: "Ext 1" },
  { name: "Rumbidzai Manyaora", amount: 100.00, room: "M8" },
  { name: "Rumbidzai Manyaora", amount: 20.00, room: "M8" },
  { name: "Tanaka Chikonyera", amount: 130.00, room: "Bus 2" },
  { name: "Nyashadzashe Chinorwiwa", amount: 120.00, room: "Up 1" },
  { name: "Natasha Chinho", amount: 180.00, room: "C1" },
  { name: "Precious Dziva", amount: 190.00, room: "M6" },
  { name: "Shelter Masosonere", amount: 20.00, room: "C2" },
  { name: "Munashe", amount: 20.00, room: "M7" },
  { name: "Sandra Chirinda", amount: 240.00, room: "Ext 2" },
  { name: "Chantelle Gora", amount: 95.00, room: "M4" },
  { name: "Shalom Gora", amount: 95.00, room: "M1" },
  { name: "Ruvimbo Singe", amount: 20.00, room: "Ext 1" },
  { name: "Thelma Nzviramiri", amount: 100.00, room: "M8" },
  { name: "Fadzai Mhizha", amount: 70.00, room: "Bus 1" },
  { name: "Kuziwa", amount: 80.00, room: "Bus 2" },
  { name: "Mitchel Chikosha", amount: 60.00, room: "Up 1" },
  { name: "Mitchel Chikosha", amount: 20.00, room: "Up 1" },
  { name: "Vannessa Magorimbo", amount: 65.00, room: "C1" },
  { name: "Vannessa Magorimbo", amount: 20.00, room: "C1" },
  { name: "Rachel Madembe", amount: 540.00, room: "C2" },
  { name: "Pelagia Gomakalila", amount: 210.00, room: "M7" },
  { name: "Pelagia Gomakalila", amount: 190.00, room: "M7" },
  { name: "Farai Muzembe", amount: 220.00, room: "Ext 2" },
  { name: "Tinotenda Chidavaenzi", amount: 200.00, room: "M4" },
  { name: "Dion sengamai", amount: 100.00, room: "M1" },
  { name: "Emma Yoradin", amount: 160.00, room: "Ext 1" },
  { name: "Ropafadzo Masara", amount: 150.00, room: "M8" },
  { name: "Kudzai Pemhiwa", amount: 240.00, room: "Bus 1" }
];

// Filter out PAYMENT 1 amounts
const filteredPayments = paymentData.filter(payment => 
  !payment1Amounts.includes(payment.amount)
);

// Calculate totals
const totalFromImage = paymentData.length;
const totalExcluded = payment1Amounts.length;
const totalToEnter = filteredPayments.length;

const totalAmountFromImage = paymentData.reduce((sum, p) => sum + p.amount, 0);
const totalAmountToEnter = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
const totalAmountExcluded = payment1Amounts.reduce((sum, amount) => sum + amount, 0);

console.log('📊 Payment Analysis:');
console.log(`📋 Total payments from image: ${totalFromImage}`);
console.log(`🚫 PAYMENT 1 amounts to exclude: ${totalExcluded}`);
console.log(`✅ Payments to enter: ${totalToEnter}`);
console.log('');
console.log('💰 Amount Analysis:');
console.log(`💰 Total amount from image: $${totalAmountFromImage.toFixed(2)}`);
console.log(`🚫 Total amount excluded (PAYMENT 1): $${totalAmountExcluded.toFixed(2)}`);
console.log(`✅ Total amount to enter: $${totalAmountToEnter.toFixed(2)}`);
console.log('');
console.log('🔍 Payments to enter:');
filteredPayments.forEach((payment, index) => {
  console.log(`${index + 1}. ${payment.name}: $${payment.amount} (${payment.room})`);
});
console.log('');
console.log('🚫 Excluded PAYMENT 1 amounts:');
console.log(`Total: ${payment1Amounts.length} payments totaling $${payment1Amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2)}`);