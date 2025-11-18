-- Query to count total beds
SELECT COUNT(*) as total_beds
FROM beds
WHERE deleted_at IS NULL;

-- Query to count beds by status
SELECT 
  status,
  COUNT(*) as bed_count
FROM beds
WHERE deleted_at IS NULL
GROUP BY status;

-- Query to count beds by room
SELECT 
  r.id as room_id,
  r.name as room_name,
  COUNT(b.id) as total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
  COUNT(CASE WHEN b.status = 'maintenance' THEN 1 END) as maintenance_beds,
  COUNT(CASE WHEN b.status = 'reserved' THEN 1 END) as reserved_beds
FROM rooms r
LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.name
ORDER BY r.name;

-- Query to count beds by boarding house
SELECT 
  bh.id as boarding_house_id,
  bh.name as boarding_house_name,
  COUNT(b.id) as total_beds,
  COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds,
  COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds
FROM boarding_houses bh
LEFT JOIN rooms r ON bh.id = r.boarding_house_id AND r.deleted_at IS NULL
LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
WHERE bh.deleted_at IS NULL
GROUP BY bh.id, bh.name
ORDER BY bh.name;

-- Query to find students without enrollments to any beds
-- This includes:
-- 1. Students with no enrollments at all
-- 2. Students with enrollments but no beds assigned to those enrollments
SELECT 
  s.id as student_id,
  s.full_name,
  s.student_number,
  s.email,
  s.phone_number,
  s.status as student_status,
  COUNT(DISTINCT se.id) as enrollment_count,
  COUNT(DISTINCT b.id) as bed_count,
  CASE 
    WHEN COUNT(DISTINCT se.id) = 0 THEN 'No enrollments'
    WHEN COUNT(DISTINCT b.id) = 0 THEN 'Enrollments but no beds'
    ELSE 'Has beds'
  END as status_description
FROM students s
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
LEFT JOIN beds b ON s.id = b.student_id AND se.id = b.enrollment_id AND b.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.full_name, s.student_number, s.email, s.phone_number, s.status
HAVING COUNT(DISTINCT b.id) = 0
ORDER BY s.full_name;

-- Alternative: Students with enrollments but no beds assigned
-- (Excludes students with no enrollments)
SELECT 
  s.id as student_id,
  s.full_name,
  s.student_number,
  s.email,
  s.phone_number,
  s.status as student_status,
  se.id as enrollment_id,
  se.start_date,
  se.expected_end_date,
  r.name as room_name,
  bh.name as boarding_house_name,
  se.agreed_amount,
  se.currency
FROM students s
INNER JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
LEFT JOIN beds b ON s.id = b.student_id AND se.id = b.enrollment_id AND b.deleted_at IS NULL
LEFT JOIN rooms r ON se.room_id = r.id
LEFT JOIN boarding_houses bh ON se.boarding_house_id = bh.id
WHERE s.deleted_at IS NULL
  AND b.id IS NULL  -- No bed assigned
ORDER BY s.full_name, se.start_date DESC;

-- Summary: Count of students without bed enrollments
SELECT 
  COUNT(*) as total_students_without_beds,
  SUM(CASE WHEN enrollment_count = 0 THEN 1 ELSE 0 END) as students_with_no_enrollments,
  SUM(CASE WHEN enrollment_count > 0 AND bed_count = 0 THEN 1 ELSE 0 END) as students_with_enrollments_but_no_beds
FROM (
  SELECT 
    s.id,
    COUNT(DISTINCT se.id) as enrollment_count,
    COUNT(DISTINCT b.id) as bed_count
  FROM students s
  LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
  LEFT JOIN beds b ON s.id = b.student_id AND se.id = b.enrollment_id AND b.deleted_at IS NULL
  WHERE s.deleted_at IS NULL
  GROUP BY s.id
  HAVING COUNT(DISTINCT b.id) = 0
) as students_without_beds;

-- Simple list: Just student names without bed enrollments
SELECT 
  s.id as student_id,
  s.full_name as student_name,
  s.student_number,
  s.email,
  s.phone_number,
  s.status as student_status
FROM students s
LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
LEFT JOIN beds b ON s.id = b.student_id AND se.id = b.enrollment_id AND b.deleted_at IS NULL
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.full_name, s.student_number, s.email, s.phone_number, s.status
HAVING COUNT(DISTINCT b.id) = 0
ORDER BY s.full_name;

-- Summary with student names list
SELECT 
  COUNT(*) as total_students_without_beds,
  SUM(CASE WHEN enrollment_count = 0 THEN 1 ELSE 0 END) as students_with_no_enrollments,
  SUM(CASE WHEN enrollment_count > 0 AND bed_count = 0 THEN 1 ELSE 0 END) as students_with_enrollments_but_no_beds,
  GROUP_CONCAT(DISTINCT student_name ORDER BY student_name SEPARATOR ', ') as student_names
FROM (
  SELECT 
    s.id,
    s.full_name as student_name,
    COUNT(DISTINCT se.id) as enrollment_count,
    COUNT(DISTINCT b.id) as bed_count
  FROM students s
  LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.deleted_at IS NULL
  LEFT JOIN beds b ON s.id = b.student_id AND se.id = b.enrollment_id AND b.deleted_at IS NULL
  WHERE s.deleted_at IS NULL
  GROUP BY s.id, s.full_name
  HAVING COUNT(DISTINCT b.id) = 0
) as students_without_beds;

