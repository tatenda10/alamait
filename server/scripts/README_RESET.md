# System Reset Scripts

This directory contains scripts to completely reset the Alamait boarding house management system, clearing all operational data while preserving the core system structure.

## ⚠️ WARNING

**These scripts will permanently delete all data!** Make sure you have:
- Complete database backups
- Exported any important data you need to keep
- Confirmed that you want to start fresh

## What Gets Cleared

The reset process will remove:

### 1. Student Data
- All student records
- All student enrollments
- All payment schedules
- All student payments
- All payment receipts
- All payment notifications

### 2. Financial Data
- All expenses
- All petty cash expenses
- All pending petty cash expenses
- All supplier payments
- All transactions
- All journal entries
- All bank reconciliation records
- All saved income statements

### 3. Account Balances
- All current account balances (reset to zero)
- All balance BD/CD records (reset to zero)

## What Gets Preserved

The reset process will keep:
- User accounts and authentication
- Room configurations
- Boarding house settings
- Chart of accounts structure
- System configuration

## Available Scripts

### 1. SQL Script (`system_reset.sql`)
- **Use**: Direct database execution
- **Best for**: Database administrators, direct MySQL access
- **Features**: Transaction safety, verification queries

### 2. Node.js Script (`system_reset.js`)
- **Use**: Command line execution
- **Best for**: Developers, automated execution
- **Features**: Better error handling, colored output, progress tracking

## How to Use

### Option 1: SQL Script (Recommended for DB Admins)

1. **Backup your database first:**
   ```bash
   mysqldump -u [username] -p [database_name] > backup_before_reset.sql
   ```

2. **Run the SQL script:**
   ```bash
   mysql -u [username] -p [database_name] < system_reset.sql
   ```

### Option 2: Node.js Script (Recommended for Developers)

1. **Install dependencies:**
   ```bash
   cd server
   npm install mysql2
   ```

2. **Update database configuration in `system_reset.js`:**
   ```javascript
   const dbConfig = {
       host: 'localhost',
       user: 'your_username',
       password: 'your_password',
       database: 'your_database_name',
       multipleStatements: true
   };
   ```

3. **Run the script:**
   ```bash
   cd server/scripts
   node system_reset.js
   ```

## Safety Features

- **Transaction Safety**: All changes are wrapped in a database transaction
- **Rollback on Error**: If anything fails, all changes are automatically rolled back
- **Verification**: Scripts verify that data was actually cleared
- **Progress Tracking**: Clear indication of what's happening at each step

## After Reset

Once the reset is complete:

1. **Verify the system is clean:**
   - Check that all tables show 0 records
   - Verify account balances are zero
   - Confirm auto-increment counters are reset

2. **Start fresh:**
   - Add new students
   - Create new enrollments
   - Begin recording new transactions
   - Set up new payment schedules

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your database user has DELETE and UPDATE privileges
2. **Foreign Key Constraints**: The scripts handle these automatically
3. **Missing Tables**: Scripts will skip non-existent tables gracefully

### If Something Goes Wrong

1. **Check the logs**: Look for error messages in the output
2. **Rollback**: If using SQL script, run `ROLLBACK;` before `COMMIT;`
3. **Restore from backup**: Use your backup to restore the system

## Support

If you encounter issues:
1. Check the error messages carefully
2. Verify your database configuration
3. Ensure you have proper database permissions
4. Consider restoring from backup and trying again

## Version History

- **v1.0**: Initial release with comprehensive reset functionality
- Includes both SQL and Node.js versions
- Transaction safety and error handling
- Verification and progress tracking
