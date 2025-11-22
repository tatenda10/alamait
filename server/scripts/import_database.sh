#!/bin/bash
# Proper database import script
# Run this on ONLINE SERVER to import the database

DB_HOST="your_online_host"
DB_USER="your_online_user"
DB_PASSWORD="your_online_password"
DB_NAME="alamait"
SQL_FILE="alamait_export.sql"

# Import the database
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < $SQL_FILE

echo "Database imported successfully!"
echo "Please verify the import by running verify_database_import.sql"


