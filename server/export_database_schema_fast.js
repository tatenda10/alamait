const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function exportSchemaFast() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    let output = '// Use DBML to define your database structure\n';
    output += '// Docs: https://dbml.dbdiagram.io/docs\n\n';
    output += '// Alamait Student Boarding Management System Database Schema\n\n';

    console.log('Fetching all table structures...');

    // Get all columns for all tables in one query
    const [allColumns] = await connection.query(`
      SELECT 
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        COLUMN_TYPE as column_type,
        IS_NULLABLE as is_nullable,
        COLUMN_KEY as column_key,
        COLUMN_DEFAULT as column_default,
        COLUMN_COMMENT as column_comment
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    // Group columns by table
    const tableColumns = {};
    allColumns.forEach(col => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    });

    // Generate table definitions
    console.log(`Generating definitions for ${Object.keys(tableColumns).length} tables...`);
    
    for (const [tableName, columns] of Object.entries(tableColumns)) {
      output += `Table ${tableName} {\n`;
      
      for (const col of columns) {
        let line = `  ${col.column_name} ${col.column_type}`;
        
        const attributes = [];
        
        // Primary key
        if (col.column_key === 'PRI') {
          attributes.push('primary key');
        }
        
        // Unique
        if (col.column_key === 'UNI') {
          attributes.push('unique');
        }
        
        // Not null
        if (col.is_nullable === 'NO' && col.column_key !== 'PRI') {
          attributes.push('not null');
        }
        
        // Default value
        if (col.column_default !== null) {
          if (col.column_default === 'CURRENT_TIMESTAMP') {
            attributes.push('default: `now()`');
          } else if (!isNaN(col.column_default)) {
            attributes.push(`default: ${col.column_default}`);
          } else {
            attributes.push(`default: "${col.column_default}"`);
          }
        }
        
        // Comment
        if (col.column_comment) {
          const safeComment = col.column_comment.replace(/'/g, "\\'");
          attributes.push(`note: '${safeComment}'`);
        }
        
        if (attributes.length > 0) {
          line += ` [${attributes.join(', ')}]`;
        }
        
        output += line + '\n';
      }
      
      output += '}\n\n';
    }

    // Get all foreign key relationships in one query
    console.log('Fetching foreign key relationships...');
    
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `, [process.env.DB_NAME]);

    output += '// Relationships\n\n';
    
    for (const constraint of constraints) {
      const refName = constraint.CONSTRAINT_NAME.replace(/^fk_/, '').replace(/_/g, '_');
      output += `Ref ${refName}: ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} > ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}\n`;
    }

    // Write to file
    fs.writeFileSync('database_schema.dbml', output);
    
    console.log('\n✅ Schema exported successfully to database_schema.dbml');
    console.log(`📊 Tables: ${Object.keys(tableColumns).length}`);
    console.log(`🔗 Relationships: ${constraints.length}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await connection.end();
    process.exit(1);
  }
}

exportSchemaFast();

