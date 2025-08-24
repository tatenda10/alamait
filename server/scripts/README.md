# July Data Import Script

This script processes the July data Excel file and creates payment schedules and payments for students.

## Prerequisites

1. Install the required dependencies:
```bash
npm install xlsx
```

2. Ensure the Excel file `july data.xlsx` is in the server root directory.

3. Make sure your database is running and the `.env` file is configured.

## Excel File Format

The script expects an Excel file with the following columns (case-insensitive):

- **Student Name** (required): Full name of the student
- **Lease Start Date** (required): Start date of the lease (YYYY-MM-DD format)
- **Lease End Date** (required): End date of the lease (YYYY-MM-DD format)
- **Monthly Rent** (required): Monthly rent amount
- **Room Number** (required): Room number or name
- **Boarding House ID** (optional): Boarding house ID (defaults to 1)

### Supported Column Name Variations

The script supports multiple column name variations:

- Student Name: `Student Name`, `StudentName`, `Name`, `Full Name`, `Student`
- Lease Start Date: `Lease Start Date`, `LeaseStartDate`, `Start Date`, `Lease Start`, `Start`
- Lease End Date: `Lease End Date`, `LeaseEndDate`, `End Date`, `Lease End`, `End`
- Monthly Rent: `Monthly Rent`, `MonthlyRent`, `Rent`, `Amount`, `Monthly Amount`
- Room Number: `Room Number`, `RoomNumber`, `Room`, `Room #`, `Room No`
- Boarding House ID: `Boarding House ID`, `BoardingHouseID`, `Boarding House`, `House ID`

## Usage

### Option 1: Using npm script
```bash
npm run import-july
```

### Option 2: Direct execution
```bash
node scripts/import_july_data.js
```

## What the Script Does

1. **Reads the Excel file** and validates the data
2. **Finds students** by name in the database
3. **Finds rooms** by room number in the specified boarding house
4. **Creates enrollments** if they don't exist
5. **Creates payment schedules** for the entire lease period (monthly)
6. **Creates payments** for all schedules (assuming full payment)

## Output

The script provides detailed logging including:

- ✅ Success messages for each step
- ❌ Error messages for failed operations
- 📊 Summary statistics at the end

### Example Output
```
🎉 July data import completed!
📊 Summary:
   ✅ Processed: 15 records
   ⏭️  Skipped: 2 records
   ❌ Errors: 1 records
```

## Error Handling

The script handles various error scenarios:

- **Missing required data**: Records are skipped with a warning
- **Student not found**: Records are skipped with a warning
- **Room not found**: Records are skipped with a warning
- **Database errors**: Errors are logged and processing continues

## Notes

- The script assumes all payments are made in full (cash payment method)
- Payment schedules are created monthly from the lease start date to end date
- Existing enrollments are reused if found
- The script is idempotent - running it multiple times won't create duplicates

## Troubleshooting

### Common Issues

1. **"Student not found"**: Ensure the student name in the Excel file matches exactly with the database
2. **"Room not found"**: Ensure the room number exists in the specified boarding house
3. **"Invalid date format"**: Ensure dates are in YYYY-MM-DD format
4. **Database connection error**: Check your `.env` file configuration

### Debug Mode

To see more detailed logging, you can modify the script to add more console.log statements.

## Database Tables Used

- `students`: Student information
- `rooms`: Room information
- `student_enrollments`: Student enrollment records
- `student_payment_schedules`: Payment schedules
- `student_payments`: Payment records 