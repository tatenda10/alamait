-- Grant CREATE DATABASE privilege to user 'tatenda10'@'%'
-- Run this as root or a user with GRANT privileges

-- Option 1: Grant only CREATE DATABASE privilege
GRANT CREATE ON *.* TO 'tatenda10'@'%';

-- Option 2: Grant all privileges (if you want full access)
-- GRANT ALL PRIVILEGES ON *.* TO 'tatenda10'@'%' WITH GRANT OPTION;

-- Option 3: Grant privileges on specific database (if you only want access to alamait_backup)
-- GRANT ALL PRIVILEGES ON alamait_backup.* TO 'tatenda10'@'%';

-- After granting privileges, flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the privileges were granted
SHOW GRANTS FOR 'tatenda10'@'%';

