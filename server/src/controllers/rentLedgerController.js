const db = require('../services/db');

// Get rent ledger data for a boarding house
exports.getRentLedger = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Get boarding house details
    const [boardingHouse] = await connection.query(
      `SELECT 
        bh.name as property_name,
        bh.location as address,
        bh.property_type,
        bh.lot_size
       FROM boarding_houses bh
       WHERE bh.id = ? AND bh.deleted_at IS NULL`,
      [req.user.boarding_house_id]
    );

    if (boardingHouse.length === 0) {
      return res.status(404).json({ message: 'Boarding house not found' });
    }

    // Get tenant data with room details and payment information
    const [tenants] = await connection.query(
      `SELECT 
        s.full_name as tenant_name,
        r.name as room,
        se.start_date as lease_start_date,
        se.expected_end_date as lease_end_date,
        se.agreed_amount as monthly_rent,
        se.security_deposit,
        se.admin_fee,
        se.additional_rent,
        se.notes
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       WHERE se.boarding_house_id = ?
         AND se.deleted_at IS NULL
         AND s.deleted_at IS NULL
       ORDER BY r.name, s.full_name`,
      [req.user.boarding_house_id]
    );

    // Format the response
    const response = {
      propertyDetails: {
        propertyName: boardingHouse[0].property_name,
        address: boardingHouse[0].address,
        propertyType: boardingHouse[0].property_type || 'Student Housing',
        lotSize: boardingHouse[0].lot_size
      },
      tenantData: tenants.map(tenant => ({
        tenantName: tenant.tenant_name,
        room: tenant.room,
        leaseStartDate: tenant.lease_start_date,
        leaseEndDate: tenant.lease_end_date,
        monthlyRent: parseFloat(tenant.monthly_rent),
        securityDeposit: parseFloat(tenant.security_deposit || 0),
        adminFee: parseFloat(tenant.admin_fee || 0),
        additionalRent: parseFloat(tenant.additional_rent || 0),
        notes: tenant.notes
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getRentLedger:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// Export rent ledger as CSV
exports.exportRentLedger = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    // Get tenant data with room details and payment information
    const [tenants] = await connection.query(
      `SELECT 
        s.full_name as tenant_name,
        r.name as room,
        se.start_date as lease_start_date,
        se.expected_end_date as lease_end_date,
        se.agreed_amount as monthly_rent,
        se.security_deposit,
        se.admin_fee,
        se.additional_rent,
        se.notes
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN rooms r ON se.room_id = r.id
       WHERE se.boarding_house_id = ?
         AND se.deleted_at IS NULL
         AND s.deleted_at IS NULL
       ORDER BY r.name, s.full_name`,
      [req.user.boarding_house_id]
    );

    // Convert to CSV format
    const csvHeader = 'Tenant Name,Room,Lease Start Date,Lease End Date,Monthly Rent,Security Deposit,Admin Fee,Additional Rent,Notes\n';
    const csvRows = tenants.map(tenant => {
      return `"${tenant.tenant_name}","${tenant.room}","${tenant.lease_start_date}","${tenant.lease_end_date}",${tenant.monthly_rent},${tenant.security_deposit || 0},${tenant.admin_fee || 0},${tenant.additional_rent || 0},"${tenant.notes || ''}"`
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rent_ledger.csv');

    res.send(csvContent);
  } catch (error) {
    console.error('Error in exportRentLedger:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
}; 