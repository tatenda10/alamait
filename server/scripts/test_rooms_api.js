const db = require('../src/services/db');

async function testRoomsAPI() {
  try {
    console.log('🔍 Testing rooms/all API...');
    
    // Test the same query as getAllRooms
    const [rooms] = await db.query(
      `SELECT 
        r.*,
        (r.capacity - r.available_beds) as current_occupants,
        bh.name as boarding_house_name,
        CASE 
          WHEN r.available_beds = r.capacity THEN 'Available'
          WHEN r.available_beds = 0 THEN 'Fully Occupied'
          WHEN r.available_beds < r.capacity THEN 'Partially Occupied'
        END as occupancy_status,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.status = 'available' THEN 1 END) as available_beds_count,
        COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds_count,
        AVG(b.price) as average_bed_price,
        MIN(b.price) as min_bed_price,
        MAX(b.price) as max_bed_price,
        MAX(CASE WHEN ri.is_display_image = 1 THEN ri.image_path END) as display_image_path,
        MAX(CASE WHEN ri.is_display_image = 1 THEN ri.id END) as display_image_id
      FROM rooms r
      LEFT JOIN boarding_houses bh ON r.boarding_house_id = bh.id
      LEFT JOIN beds b ON r.id = b.room_id AND b.deleted_at IS NULL
      LEFT JOIN room_images ri ON r.id = ri.room_id AND ri.deleted_at IS NULL
      WHERE r.deleted_at IS NULL 
        AND r.status = 'active'
      GROUP BY r.id, r.name, r.capacity, r.available_beds, r.price_per_bed, r.admin_fee, r.security_deposit, r.additional_rent, r.description, r.boarding_house_id, bh.name
      ORDER BY bh.name, r.name`
    );
    
    console.log('Rooms found:', rooms.length);
    
    if (rooms.length > 0) {
      // Show the first room's data
      const room = rooms[0];
      console.log('First room data:');
      console.log('ID:', room.id);
      console.log('Name:', room.name);
      console.log('Display Image Path:', room.display_image_path);
      console.log('Display Image ID:', room.display_image_id);
      
      // Transform like the API does
      const transformedRoom = {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        currentOccupants: room.capacity - room.available_beds,
        rent: parseFloat(room.price_per_bed || 0),
        adminFee: parseFloat(room.admin_fee || 0),
        securityDeposit: parseFloat(room.security_deposit || 0),
        additionalRent: parseFloat(room.additional_rent || 0),
        description: room.description,
        status: room.occupancy_status,
        boarding_house_name: room.boarding_house_name,
        boarding_house_id: room.boarding_house_id,
        displayImage: room.display_image_path ? `/api/rooms/${room.id}/images/${room.display_image_id}` : null,
        bedInfo: {
          totalBeds: room.total_beds || 0,
          availableBeds: room.available_beds_count || 0,
          occupiedBeds: room.occupied_beds_count || 0,
          averagePrice: parseFloat(room.average_bed_price || 0),
          minPrice: parseFloat(room.min_bed_price || 0),
          maxPrice: parseFloat(room.max_bed_price || 0)
        }
      };
      
      console.log('Transformed room:');
      console.log('Display Image URL:', transformedRoom.displayImage);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testRoomsAPI();
