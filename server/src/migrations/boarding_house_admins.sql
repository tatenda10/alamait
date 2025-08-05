CREATE TABLE IF NOT EXISTS boarding_house_admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boarding_house_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (boarding_house_id) REFERENCES boarding_houses(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_admin_house (boarding_house_id, user_id, deleted_at)
); 