# Budget Request and Expenditure Management - Backend Implementation

## Overview

This document describes the backend implementation for the budget request and expenditure management system. The backend provides RESTful APIs for managing budget requests and expenditure requests with approval workflows.

## Database Schema

### Budget Requests Tables

#### `budget_requests`
- `id` - Primary key
- `month` - Budget month (VARCHAR)
- `year` - Budget year (INT)
- `total_amount` - Total budget amount (DECIMAL)
- `description` - Budget description (TEXT)
- `status` - Request status: 'pending', 'approved', 'rejected' (ENUM)
- `submitted_by` - User ID who submitted (INT, FK to users)
- `submitted_date` - Submission timestamp
- `approved_by` - User ID who approved (INT, FK to users, nullable)
- `approved_date` - Approval timestamp (nullable)
- `rejected_by` - User ID who rejected (INT, FK to users, nullable)
- `rejected_date` - Rejection timestamp (nullable)
- `rejection_reason` - Reason for rejection (TEXT, nullable)

#### `budget_categories`
- `id` - Primary key
- `budget_request_id` - Foreign key to budget_requests (INT)
- `category_name` - Category name (VARCHAR)
- `amount` - Category amount (DECIMAL)
- `description` - Category description (TEXT)

### Expenditure Requests Tables

#### `expenditure_requests`
- `id` - Primary key
- `title` - Request title (VARCHAR)
- `description` - Request description (TEXT)
- `amount` - Expenditure amount (DECIMAL)
- `category` - Expenditure category (VARCHAR)
- `priority` - Priority level: 'low', 'medium', 'high', 'urgent' (ENUM)
- `expected_date` - Expected expenditure date (DATE)
- `vendor` - Vendor/supplier name (VARCHAR)
- `justification` - Justification for expenditure (TEXT)
- `status` - Request status: 'pending', 'approved', 'rejected' (ENUM)
- `submitted_by` - User ID who submitted (INT, FK to users)
- `submitted_date` - Submission timestamp
- `approved_by` - User ID who approved (INT, FK to users, nullable)
- `approved_date` - Approval timestamp (nullable)
- `rejected_by` - User ID who rejected (INT, FK to users, nullable)
- `rejected_date` - Rejection timestamp (nullable)
- `rejection_reason` - Reason for rejection (TEXT, nullable)

#### `expenditure_attachments`
- `id` - Primary key
- `expenditure_request_id` - Foreign key to expenditure_requests (INT)
- `file_name` - Original file name (VARCHAR)
- `file_path` - File path on server (VARCHAR)
- `file_size` - File size in bytes (INT)
- `mime_type` - File MIME type (VARCHAR)
- `uploaded_by` - User ID who uploaded (INT, FK to users)
- `uploaded_at` - Upload timestamp

## API Endpoints

### Budget Requests API

#### Base URL: `/api/budget-requests`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all budget requests | Yes |
| GET | `/:id` | Get budget request by ID | Yes |
| POST | `/` | Create new budget request | Yes |
| PUT | `/:id` | Update budget request | Yes |
| POST | `/:id/approve` | Approve budget request | Yes |
| POST | `/:id/reject` | Reject budget request | Yes |
| DELETE | `/:id` | Delete budget request | Yes |

#### Request/Response Examples

**Create Budget Request:**
```json
POST /api/budget-requests
{
  "month": "January",
  "year": 2024,
  "totalAmount": 50000,
  "description": "Monthly operational budget",
  "categories": [
    {
      "name": "Office Supplies",
      "amount": 15000,
      "description": "Stationery and office materials"
    },
    {
      "name": "Utilities",
      "amount": 20000,
      "description": "Electricity, water, internet"
    }
  ]
}
```

**Approve Budget Request:**
```json
POST /api/budget-requests/1/approve
```

**Reject Budget Request:**
```json
POST /api/budget-requests/1/reject
{
  "reason": "Budget amount exceeds monthly limit"
}
```

### Expenditure Requests API

#### Base URL: `/api/expenditure-requests`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all expenditure requests | Yes |
| GET | `/:id` | Get expenditure request by ID | Yes |
| POST | `/` | Create new expenditure request | Yes |
| PUT | `/:id` | Update expenditure request | Yes |
| POST | `/:id/approve` | Approve expenditure request | Yes |
| POST | `/:id/reject` | Reject expenditure request | Yes |
| DELETE | `/:id` | Delete expenditure request | Yes |
| POST | `/:id/attachments` | Upload attachment | Yes |
| GET | `/:id/attachments/:attachmentId` | Download attachment | Yes |

#### Request/Response Examples

**Create Expenditure Request:**
```json
POST /api/expenditure-requests
{
  "title": "Office Printer Maintenance",
  "description": "Regular maintenance and toner replacement",
  "amount": 2500,
  "category": "Maintenance",
  "priority": "medium",
  "expectedDate": "2024-01-20",
  "vendor": "Tech Solutions Ltd",
  "justification": "Printer is showing error messages and needs immediate attention"
}
```

**Upload Attachment:**
```bash
POST /api/expenditure-requests/1/attachments
Content-Type: multipart/form-data

attachment: [file]
```

## File Structure

```
server/src/
├── controllers/
│   ├── budgetRequestController.js      # Budget request business logic
│   └── expenditureRequestController.js # Expenditure request business logic
├── routes/
│   ├── budgetRequests.js               # Budget request routes
│   └── expenditureRequests.js          # Expenditure request routes
├── migrations/
│   ├── create_budget_requests_table.sql
│   └── create_expenditure_requests_table.sql
└── uploads/
    └── expenditure-attachments/        # File upload directory
```

## Authentication & Authorization

All API endpoints require authentication using JWT tokens. The authentication middleware extracts user information from the token and makes it available in `req.user`.

### User Roles
- **Branch Administrator (BA)**: Can create and view their own requests
- **System Administrator**: Can approve/reject all requests

## File Upload Handling

### Supported File Types
- PDF documents
- Images (JPEG, JPG, PNG)
- Microsoft Word documents (.doc, .docx)
- Microsoft Excel documents (.xls, .xlsx)

### File Size Limit
- Maximum file size: 10MB per file

### File Storage
- Files are stored in `server/uploads/expenditure-attachments/`
- Original filenames are preserved
- Unique suffixes are added to prevent filename conflicts

## Error Handling

The API uses consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Database Setup

### Running Migrations

1. Ensure your database is running and accessible
2. Set up environment variables in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=alamait_boarding_school
   ```

3. Run the migration script:
   ```bash
   node run_budget_expenditure_migration.js
   ```

### Manual Setup

If you prefer to run migrations manually:

1. Connect to your MySQL database
2. Execute the SQL files in order:
   ```sql
   -- Run create_budget_requests_table.sql
   -- Run create_expenditure_requests_table.sql
   ```

## Testing the API

### Using curl

**Create Budget Request:**
```bash
curl -X POST http://localhost:5000/api/budget-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "month": "January",
    "year": 2024,
    "totalAmount": 50000,
    "description": "Monthly operational budget",
    "categories": [
      {
        "name": "Office Supplies",
        "amount": 15000,
        "description": "Stationery and office materials"
      }
    ]
  }'
```

**Get All Budget Requests:**
```bash
curl -X GET http://localhost:5000/api/budget-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Upload File:**
```bash
curl -X POST http://localhost:5000/api/expenditure-requests/1/attachments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "attachment=@/path/to/your/file.pdf"
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **File Validation**: Only specific file types are allowed
3. **File Size Limits**: Prevents large file uploads
4. **SQL Injection Prevention**: Using parameterized queries
5. **File Path Security**: Files are stored outside web root
6. **CORS Configuration**: Properly configured for frontend domains

## Performance Considerations

1. **Database Indexing**: Proper indexes on frequently queried columns
2. **File Storage**: Efficient file handling with proper cleanup
3. **Transaction Management**: Database transactions for data consistency
4. **Error Logging**: Comprehensive error logging for debugging

## Future Enhancements

1. **Email Notifications**: Automatic email alerts for status changes
2. **File Compression**: Automatic image compression for uploads
3. **Audit Trail**: Detailed logging of all approval/rejection actions
4. **Batch Operations**: Bulk approve/reject functionality
5. **Advanced Filtering**: More sophisticated filtering and search
6. **Export Functionality**: Export requests to PDF/Excel
7. **Integration**: Direct integration with accounting systems

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials in `.env`
   - Ensure database server is running
   - Verify database exists

2. **File Upload Issues**
   - Check file size limits
   - Verify file type is allowed
   - Ensure upload directory exists and is writable

3. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper Authorization header format

4. **Permission Errors**
   - Verify user has appropriate role
   - Check database user permissions
   - Ensure file system permissions are correct

### Logs

Check server logs for detailed error information:
```bash
# If using PM2
pm2 logs

# If running directly
# Check console output for error messages
```

## Support

For technical support or questions about the backend implementation, please refer to the main system documentation or contact the development team.
