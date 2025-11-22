# Database Export/Import Instructions

## Common Issues When Exporting/Importing MySQL Databases

### Issue: Data Missing After Import

This usually happens because:
1. **Export method doesn't include all data**
2. **Foreign key constraints fail during import**
3. **Character set/collation mismatches**
4. **Import errors are being ignored**

## Proper Export Method (from Localhost)

### Option 1: Using MySQL Workbench
1. **Server** → **Data Export**
2. Select your database (`alamait`)
3. **Select all tables**
4. **Export Options**:
   - ✅ Include Create Schema
   - ✅ Include Drop Schema
   - ✅ Export to Self-Contained File
   - ✅ Include Views
   - ✅ Include Routines
   - ✅ Include Triggers
   - ✅ Include Events
5. **Advanced Options**:
   - ✅ Complete INSERT statements
   - ✅ Add DROP TABLE statements
   - ✅ Disable foreign key checks
6. Click **Start Export**

### Option 2: Using Command Line (mysqldump)

```bash
# On localhost, run:
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-table \
  --complete-insert \
  --extended-insert=FALSE \
  --default-character-set=utf8mb4 \
  alamait > alamait_export.sql
```

### Option 3: Using phpMyAdmin
1. Select your database
2. Click **Export** tab
3. Select **Custom** method
4. **Format**: SQL
5. **Options**:
   - ✅ Structure
   - ✅ Data
   - ✅ Add DROP TABLE
   - ✅ Add IF NOT EXISTS
   - ✅ Complete inserts
6. Click **Go**

## Proper Import Method (to Online Server)

### Option 1: Using MySQL Workbench
1. **Server** → **Data Import**
2. Select **Import from Self-Contained File**
3. Choose your exported `.sql` file
4. **Default Target Schema**: Select or create `alamait`
5. **Import Options**:
   - ✅ Dump Structure and Data
6. Click **Start Import**
7. **Check the log for errors!**

### Option 2: Using Command Line

```bash
# On online server, run:
mysql -u your_user -p alamait < alamait_export.sql
```

**Important**: Check for errors:
```bash
mysql -u your_user -p alamait < alamait_export.sql 2>&1 | tee import_log.txt
```

### Option 3: Using phpMyAdmin
1. Select your database
2. Click **Import** tab
3. Choose your `.sql` file
4. Click **Go**
5. **Check for errors in the result message!**

## Verification Steps

After importing, run this query on BOTH databases and compare:

```sql
-- Run verify_database_import.sql on both databases
-- Compare the results
```

## Common Import Errors to Check For

1. **Foreign Key Constraint Errors**
   - Solution: Import with `SET FOREIGN_KEY_CHECKS=0;` at the start

2. **Character Set Errors**
   - Solution: Ensure both databases use `utf8mb4`

3. **Missing Tables**
   - Solution: Check if all tables were exported

4. **Data Truncation**
   - Solution: Check column sizes match

5. **Import Timeout**
   - Solution: Increase `max_execution_time` in PHP or use command line

## Quick Fix: Re-export with This Command

```bash
# On localhost - This ensures everything is exported
mysqldump -u root -p \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --add-drop-table \
  --complete-insert \
  --extended-insert=FALSE \
  --default-character-set=utf8mb4 \
  --set-charset \
  alamait > alamait_full_export_$(date +%Y%m%d_%H%M%S).sql
```

## After Import - Verify Data

Run `verify_database_import.sql` on the online server and compare with localhost results.


