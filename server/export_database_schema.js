const mysql = require('mysql2/promise');
require('dotenv').config();

async function exportSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('// Use DBML to define your database structure');
    console.log('// Docs: https://dbml.dbdiagram.io/docs\n');
    console.log('// Alamait Student Boarding Management System Database Schema\n');

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    for (const tableName of tableNames) {
      // Get table structure
      const [columns] = await connection.query(`SHOW FULL COLUMNS FROM \`${tableName}\``);
      
      console.log(`Table ${tableName} {`);
      
      for (const col of columns) {
        let line = `  ${col.Field} ${col.Type}`;
        
        const attributes = [];
        
        // Check for primary key
        if (col.Key === 'PRI') {
          attributes.push('primary key');
        }
        
        // Check for unique
        if (col.Key === 'UNI') {
          attributes.push('unique');
        }
        
        // Check for not null
        if (col.Null === 'NO' && col.Key !== 'PRI') {
          attributes.push('not null');
        }
        
        // Check for default value
        if (col.Default !== null && col.Default !== 'NULL') {
          // Handle different default types
          if (col.Default === 'CURRENT_TIMESTAMP') {
            attributes.push(`default: \`now()\``);
          } else if (!isNaN(col.Default)) {
            attributes.push(`default: ${col.Default}`);
          } else {
            attributes.push(`default: '${col.Default}'`);
          }
        }
        
        // Add comment/note if exists
        if (col.Comment) {
          attributes.push(`note: '${col.Comment.replace(/'/g, "\\'")}'`);
        }
        
        if (attributes.length > 0) {
          line += ` [${attributes.join(', ')}]`;
        }
        
        console.log(line);
      }
      
      console.log('}\n');
    }

    // Get foreign key relationships
    console.log('// Relationships\n');
    
    for (const tableName of tableNames) {
      const [constraints] = await connection.query(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.DB_NAME, tableName]);

      for (const constraint of constraints) {
        const refName = constraint.CONSTRAINT_NAME.replace(/^fk_/, '').replace(/_/g, '_');
        console.log(`Ref ${refName}: ${tableName}.${constraint.COLUMN_NAME} > ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    await connection.end();
    process.exit(1);
  }
}

exportSchema();

