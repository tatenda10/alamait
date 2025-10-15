# Budget Request and Expenditure Management System

## Overview

This system implements a comprehensive budget request and expenditure approval workflow for branch administrators (BA) in the boarding house management system. The system follows a structured approval process to ensure proper financial control and accountability.

## System Workflow

### 1. Budget Request Process

**Step 1: BA Login**
- Branch Administrator logs into the system
- Access to budget management features

**Step 2: Budget Request Submission**
- BA navigates to "Budget Management" → "Budget Request"
- Fills out monthly budget request form with:
  - Month and Year selection
  - Budget categories (Office Supplies, Utilities, Maintenance, Marketing, Other)
  - Amount for each category
  - Description and justification
- Submits request for approval

**Step 3: Main System Approval**
- System admin reviews budget requests in "Budget Management" → "Budget Approval"
- Can approve or reject requests with reasons
- Approved budgets become available for expenditure

### 2. Expenditure Request Process

**Step 1: Expenditure Request Submission**
- BA navigates to "Expenditure" → "Expenditure Request"
- Fills out expenditure request form with:
  - Title and description
  - Amount and category
  - Priority level (Low, Medium, High, Urgent)
  - Expected date and vendor information
  - Justification for the expenditure
  - File attachments (quotes, receipts, etc.)

**Step 2: System Admin Approval**
- System admin reviews expenditure requests in "Expenditure" → "Expenditure Approval"
- Can approve or reject requests with detailed reasons
- Approved expenditures become part of the main expenditure system

**Step 3: Integration with Main System**
- Approved expenditures are automatically integrated into the main financial system
- Available for reporting and accounting purposes

## Features

### Budget Management
- **Budget Dashboard**: Overview of all budget statistics and recent activity
- **Budget Request**: Submit new monthly budget requests
- **Budget Approval**: Review and approve/reject budget requests
- **Category Management**: Predefined budget categories with custom amounts
- **Status Tracking**: Track request status (Pending, Approved, Rejected)

### Expenditure Management
- **Expenditure Request**: Submit detailed expenditure requests
- **Expenditure Approval**: Review and approve/reject expenditure requests
- **Priority Levels**: Categorize requests by urgency
- **File Attachments**: Upload supporting documents
- **Vendor Management**: Track vendor information
- **Status Tracking**: Monitor request progress

### Dashboard & Analytics
- **Budget Overview**: Total requests, pending, approved, rejected counts
- **Expenditure Overview**: Similar statistics for expenditure requests
- **Recent Activity**: Latest budget and expenditure requests
- **Financial Summary**: Total approved amounts

## File Structure

```
branch/src/
├── pages/
│   ├── budget/
│   │   ├── BudgetDashboard.jsx      # Main budget overview
│   │   ├── BudgetRequest.jsx        # Submit budget requests
│   │   └── BudgetApproval.jsx       # Approve/reject budget requests
│   └── expenditure/
│       ├── ExpenditureRequest.jsx   # Submit expenditure requests
│       └── ExpenditureApproval.jsx  # Approve/reject expenditure requests
├── utils/
│   └── api.js                       # API utilities for budget/expenditure
└── components/layout/
    └── Sidebar.jsx                  # Updated navigation
```

## API Endpoints

### Budget API
- `GET /api/budget-requests` - Get all budget requests
- `GET /api/budget-requests/:id` - Get specific budget request
- `POST /api/budget-requests` - Create new budget request
- `PUT /api/budget-requests/:id` - Update budget request
- `POST /api/budget-requests/:id/approve` - Approve budget request
- `POST /api/budget-requests/:id/reject` - Reject budget request
- `DELETE /api/budget-requests/:id` - Delete budget request

### Expenditure API
- `GET /api/expenditure-requests` - Get all expenditure requests
- `GET /api/expenditure-requests/:id` - Get specific expenditure request
- `POST /api/expenditure-requests` - Create new expenditure request
- `PUT /api/expenditure-requests/:id` - Update expenditure request
- `POST /api/expenditure-requests/:id/approve` - Approve expenditure request
- `POST /api/expenditure-requests/:id/reject` - Reject expenditure request
- `DELETE /api/expenditure-requests/:id` - Delete expenditure request
- `POST /api/expenditure-requests/:id/attachments` - Upload attachment
- `GET /api/expenditure-requests/:id/attachments/:attachmentId` - Download attachment

### Dashboard API
- `GET /api/dashboard/budget-overview` - Budget statistics
- `GET /api/dashboard/expenditure-overview` - Expenditure statistics
- `GET /api/dashboard/pending-approvals` - Pending approvals count

## Navigation Structure

### Budget Management
- Budget Dashboard (`/dashboard/budget`)
- Budget Request (`/dashboard/budget/request`)
- Budget Approval (`/dashboard/budget/approval`)

### Expenditure Management
- Expenditure Request (`/dashboard/expenditure/request`)
- Expenditure Approval (`/dashboard/expenditure/approval`)

## User Roles & Permissions

### Branch Administrator (BA)
- Submit budget requests
- Submit expenditure requests
- View own request status
- Access budget dashboard

### System Administrator
- Approve/reject budget requests
- Approve/reject expenditure requests
- View all requests and statistics
- Access comprehensive dashboard

## Data Models

### Budget Request
```javascript
{
  id: number,
  month: string,
  year: number,
  totalAmount: number,
  description: string,
  categories: [
    {
      name: string,
      amount: number,
      description: string
    }
  ],
  status: 'pending' | 'approved' | 'rejected',
  submittedDate: string,
  submittedBy: string,
  approvedDate?: string,
  rejectedDate?: string,
  rejectionReason?: string
}
```

### Expenditure Request
```javascript
{
  id: number,
  title: string,
  description: string,
  amount: number,
  category: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  expectedDate: string,
  vendor: string,
  justification: string,
  attachments: string[],
  status: 'pending' | 'approved' | 'rejected',
  submittedDate: string,
  submittedBy: string,
  approvedDate?: string,
  rejectedDate?: string,
  rejectionReason?: string
}
```

## Security Considerations

- All API requests require authentication tokens
- File uploads are validated for type and size
- User permissions are checked for approval actions
- Audit trail maintained for all approval/rejection actions

## Future Enhancements

1. **Email Notifications**: Automatic email alerts for status changes
2. **Budget Limits**: Set maximum budget amounts per category
3. **Multi-level Approval**: Multiple approval levels for large amounts
4. **Integration**: Direct integration with accounting software
5. **Reporting**: Advanced financial reports and analytics
6. **Mobile Support**: Mobile-responsive design for on-the-go access

## Getting Started

1. Ensure the backend API endpoints are implemented
2. Update the API base URL in `utils/api.js` if needed
3. Configure user roles and permissions
4. Test the workflow with sample data
5. Train users on the new system

## Support

For technical support or questions about the budget and expenditure system, please contact the development team or refer to the main system documentation.
