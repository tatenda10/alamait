-- Create beds table for individual bed pricing
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
);

-- Add bed_count column to rooms table to track total beds
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS bed_count INT DEFAULT 0 AFTER capacity;

-- Update bed_count to match capacity for existing rooms
UPDATE rooms SET bed_count = capacity WHERE bed_count = 0;

-- Create indexes for better performance
CREATE INDEX idx_beds_room_status ON beds(room_id, status);
CREATE INDEX idx_beds_student ON beds(student_id);

-- Create beds for existing rooms (this will be run after the table is created)
-- This script will create beds based on existing room capacity
DELIMITER //
CREATE PROCEDURE CreateBedsForExistingRooms()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE room_id_var INT;
  DECLARE room_capacity_var INT;
  DECLARE room_name_var VARCHAR(255);
  DECLARE room_price_var DECIMAL(15,2);
  
  DECLARE room_cursor CURSOR FOR 
    SELECT id, capacity, name, COALESCE(price_per_bed, rent, 0) as price
    FROM rooms 
    WHERE deleted_at IS NULL;
    
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN room_cursor;
  
  room_loop: LOOP
    FETCH room_cursor INTO room_id_var, room_capacity_var, room_name_var, room_price_var;
    
    IF done THEN
      LEAVE room_loop;
    END IF;
    
    -- Create beds for this room
    SET @bed_counter = 1;
    WHILE @bed_counter <= room_capacity_var DO
      INSERT INTO beds (room_id, bed_number, price, status, created_at)
      VALUES (room_id_var, CONCAT(room_name_var, '-B', @bed_counter), room_price_var, 'available', NOW());
      SET @bed_counter = @bed_counter + 1;
    END WHILE;
    
  END LOOP;
  
  CLOSE room_cursor;
END //
DELIMITER ;

-- Call the procedure to create beds for existing rooms
CALL CreateBedsForExistingRooms();

-- Drop the procedure after use
DROP PROCEDURE CreateBedsForExistingRooms();
