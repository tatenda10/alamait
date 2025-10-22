-- Add bed_image column to beds table
ALTER TABLE beds 
ADD COLUMN bed_image VARCHAR(255) NULL AFTER notes;

-- Create index for better performance
CREATE INDEX idx_beds_image ON beds(bed_image);
