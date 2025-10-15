const mysql = require('mysql2/promise');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alamait',
  port: process.env.DB_PORT || 3306
};

async function runBedsMigration() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🛏️ Starting beds migration...\n');
    
    await connection.beginTransaction();
    
    // 1. Create beds table
    console.log('Creating beds table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS beds (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        bed_number VARCHAR(50) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
        student_id INT NULL,
        enrollment_id INT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(id) ON DELETE SET NULL,
        UNIQUE KEY unique_bed_per_room (room_id, bed_number)
      )
    `);
    console.log('✅ Beds table created');
    
    // 2. Add bed_count column to rooms table
    console.log('Adding bed_count column to rooms table...');
    try {
      await connection.execute(`
        ALTER TABLE rooms 
        ADD COLUMN bed_count INT DEFAULT 0 AFTER capacity
      `);
      console.log('✅ bed_count column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ bed_count column already exists');
      } else {
        throw error;
      }
    }
    
    // 3. Update bed_count to match capacity for existing rooms
    console.log('Updating bed_count for existing rooms...');
    await connection.execute(`
      UPDATE rooms SET bed_count = capacity WHERE bed_count = 0
    `);
    console.log('✅ bed_count updated');
    
    // 4. Create indexes
    console.log('Creating indexes...');
    try {
      await connection.execute(`CREATE INDEX idx_beds_room_status ON beds(room_id, status)`);
      console.log('✅ Index idx_beds_room_status created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ Index idx_beds_room_status already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_beds_student ON beds(student_id)`);
      console.log('✅ Index idx_beds_student created');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️ Index idx_beds_student already exists');
      } else {
        throw error;
      }
    }
    
    // 5. Create beds for existing rooms
    console.log('Creating beds for existing rooms...');
    const [rooms] = await connection.execute(`
      SELECT id, name, capacity, COALESCE(price_per_bed, 0) as price
      FROM rooms 
      WHERE deleted_at IS NULL
    `);
    
    let bedsCreated = 0;
    for (const room of rooms) {
      // Check if beds already exist for this room
      const [existingBeds] = await connection.execute(
        'SELECT COUNT(*) as count FROM beds WHERE room_id = ?',
        [room.id]
      );
      
      if (existingBeds[0].count === 0) {
        // Create beds for this room
        for (let i = 1; i <= room.capacity; i++) {
          await connection.execute(`
            INSERT INTO beds (room_id, bed_number, price, status, created_at)
            VALUES (?, ?, ?, 'available', NOW())
          `, [room.id, `${room.name}-B${i}`, room.price]);
          bedsCreated++;
        }
        console.log(`   Created ${room.capacity} beds for room ${room.name}`);
      } else {
        console.log(`   Room ${room.name} already has beds`);
      }
    }
    
    await connection.commit();
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE 'beds'");
    if (tables.length > 0) {
      console.log('✅ Beds table created successfully');
      
      const [bedCount] = await connection.execute('SELECT COUNT(*) as count FROM beds');
      console.log(`📊 Total beds created: ${bedCount[0].count}`);
      
      const [roomCount] = await connection.execute('SELECT COUNT(*) as count FROM rooms WHERE deleted_at IS NULL');
      console.log(`🏠 Total rooms: ${roomCount[0].count}`);
      
      // Show sample beds
      const [sampleBeds] = await connection.execute(`
        SELECT 
          b.bed_number,
          b.price,
          b.status,
          r.name as room_name,
          bh.name as boarding_house_name
        FROM beds b
        JOIN rooms r ON b.room_id = r.id
        JOIN boarding_houses bh ON r.boarding_house_id = bh.id
        LIMIT 5
      `);
      
      if (sampleBeds.length > 0) {
        console.log('\n📋 Sample beds created:');
        sampleBeds.forEach(bed => {
          console.log(`   ${bed.bed_number} in ${bed.room_name} (${bed.boarding_house_name}) - $${bed.price} - ${bed.status}`);
        });
      }
    } else {
      console.log('❌ Beds table was not created');
    }
    
    console.log('\n🎉 Beds migration completed successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
runBedsMigration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
