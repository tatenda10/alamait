-- Add 'actioned' status to expenditure_requests table
ALTER TABLE expenditure_requests 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'actioned') DEFAULT 'pending';
