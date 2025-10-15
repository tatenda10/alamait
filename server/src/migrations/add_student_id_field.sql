-- Add unique student ID field to students table
ALTER TABLE students 
ADD COLUMN student_id VARCHAR(20) UNIQUE AFTER id;

-- Create index for student_id
CREATE INDEX idx_students_student_id ON students(student_id);
