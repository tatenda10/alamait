#!/bin/bash
# Proper database export script
# Run this on LOCALHOST to export the database

DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_password_here"
DB_NAME="alamait"

# Export with all data, structure, and constraints
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-table \
  --complete-insert \
  --extended-insert=FALSE \
  --default-character-set=utf8mb4 \
  $DB_NAME > alamait_export_$(date +%Y%m%d_%H%M%S).sql

echo "Database exported successfully!"


