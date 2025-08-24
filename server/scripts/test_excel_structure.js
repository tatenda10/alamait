const XLSX = require('xlsx');
const path = require('path');

// Function to convert Excel date to JavaScript date
function convertExcelDate(excelDate) {
  if (typeof excelDate === 'number') {
    // Excel date is number of days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
    return date;
  } else if (typeof excelDate === 'string') {
    // Try to parse as date string
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
    // Try DD/MM/YYYY format
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      if (year < 100) {
        year += 2000; // Assume 20xx for 2-digit years
      }
      return new Date(year, month, day);
    }
  }
  return null;
}

// Function to test Excel file structure
function testExcelStructure(filePath) {
  try {
    console.log(`🔍 Testing Excel file structure: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📄 Sheet name: ${sheetName}`);
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null 
    });
    
    if (jsonData.length < 2) {
      console.log('❌ Excel file must have at least a header row and one data row');
      return false;
    }
    
    // Get headers from first row
    const headers = jsonData[0].map(header => header ? header.toString().trim() : '');
    const rows = jsonData.slice(1);
    
    console.log(`📊 Found ${rows.length} data rows`);
    console.log(`📋 Headers:`, headers);
    
    // Check for required fields based on actual Excel structure
    const requiredFields = [
      { name: 'Student Name', variations: ['Tenant name', 'Student Name', 'StudentName', 'Name', 'Full Name', 'Student'] },
      { name: 'Lease Start Date', variations: ['Lease start date', 'Lease Start Date', 'LeaseStartDate', 'Start Date', 'Lease Start', 'Start'] },
      { name: 'Lease End Date', variations: ['Lease end date', 'Lease End Date', 'LeaseEndDate', 'End Date', 'Lease End', 'End'] },
      { name: 'Monthly Rent', variations: ['Monthly rent', 'Monthly Rent', 'MonthlyRent', 'Rent', 'Amount', 'Monthly Amount'] },
      { name: 'Room Number', variations: ['Room', 'Room Number', 'RoomNumber', 'Room #', 'Room No'] }
    ];
    
    const foundFields = [];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      const found = headers.some(header => 
        field.variations.some(variation => 
          header.toLowerCase().includes(variation.toLowerCase().replace(' ', '')) ||
          header.toLowerCase().includes(variation.toLowerCase())
        )
      );
      
      if (found) {
        foundFields.push(field.name);
      } else {
        missingFields.push(field.name);
      }
    });
    
    console.log(`\n✅ Found fields:`, foundFields);
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields:`, missingFields);
    }
    
    // Show sample data
    if (rows.length > 0) {
      console.log(`\n📝 Sample data (first row):`);
      const sampleRow = rows[0];
      headers.forEach((header, index) => {
        if (header && sampleRow[index] !== undefined && sampleRow[index] !== null) {
          let value = sampleRow[index];
          
          // Convert dates for display
          if (header.toLowerCase().includes('date')) {
            const convertedDate = convertExcelDate(value);
            if (convertedDate) {
              value = `${value} (converted: ${convertedDate.toISOString().split('T')[0]})`;
            }
          }
          
          console.log(`   ${header}: ${value}`);
        }
      });
    }
    
    // Check for data quality issues
    let emptyRows = 0;
    let invalidDates = 0;
    let invalidNumbers = 0;
    
    rows.forEach((row, index) => {
      // Check for empty rows
      if (row.every(cell => cell === null || cell === undefined || cell === '')) {
        emptyRows++;
      }
      
      // Check for invalid dates
      const startDateIndex = headers.findIndex(h => h.toLowerCase().includes('start'));
      const endDateIndex = headers.findIndex(h => h.toLowerCase().includes('end'));
      
      if (startDateIndex >= 0 && row[startDateIndex]) {
        const startDate = convertExcelDate(row[startDateIndex]);
        if (!startDate || isNaN(startDate.getTime())) {
          invalidDates++;
        }
      }
      
      if (endDateIndex >= 0 && row[endDateIndex]) {
        const endDate = convertExcelDate(row[endDateIndex]);
        if (!endDate || isNaN(endDate.getTime())) {
          invalidDates++;
        }
      }
      
      // Check for invalid numbers
      const rentIndex = headers.findIndex(h => h.toLowerCase().includes('rent') || h.toLowerCase().includes('amount'));
      if (rentIndex >= 0 && row[rentIndex]) {
        const rent = parseFloat(row[rentIndex]);
        if (isNaN(rent) || rent <= 0) {
          invalidNumbers++;
        }
      }
    });
    
    console.log(`\n🔍 Data quality check:`);
    console.log(`   Empty rows: ${emptyRows}`);
    console.log(`   Invalid dates: ${invalidDates}`);
    console.log(`   Invalid numbers: ${invalidNumbers}`);
    
    return missingFields.length === 0;
    
  } catch (error) {
    console.error('❌ Error testing Excel file:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const filePath = './july data.xlsx';
  const isValid = testExcelStructure(filePath);
  
  if (isValid) {
    console.log('\n✅ Excel file structure is valid! You can proceed with the import.');
  } else {
    console.log('\n❌ Excel file structure has issues. Please fix them before running the import.');
  }
}

module.exports = { testExcelStructure }; 