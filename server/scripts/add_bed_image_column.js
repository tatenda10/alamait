const db = require('../src/services/db');

async function addBedImageColumn() {
  const conn = await db.getConnection();
  try {
    console.log('🖼️ Adding bed_image column to beds table...');
    
    await conn.query(`
      ALTER TABLE beds 
      ADD COLUMN bed_image VARCHAR(255) NULL AFTER notes
    `);
    
    console.log('✅ Added bed_image column');
    
    // Create index for better performance
    await conn.query(`
      CREATE INDEX idx_beds_image ON beds(bed_image)
    `);
    
    console.log('✅ Created index for bed_image column');
    
    conn.release();
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ bed_image column already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
    conn.release();
    process.exit(1);
  }
}

addBedImageColumn();