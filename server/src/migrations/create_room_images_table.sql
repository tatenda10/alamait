-- Room Images Table
CREATE TABLE IF NOT EXISTS room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_display_image BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_room_id (room_id),
    INDEX idx_display_image (is_display_image),
    INDEX idx_created_at (created_at)
);
