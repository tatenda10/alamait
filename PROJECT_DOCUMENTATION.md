# Alamait Student Boarding Management System

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Getting Started](#getting-started)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Features](#features)
9. [Authentication & Authorization](#authentication--authorization)
10.[Deployment](#deployment)
11.[Development Guidelines](#development-guidelines)

---

## Overview

The **Alamait Student Boarding Management System** is a comprehensive, multi-tenant platform designed to manage student boarding houses, room assignments, financial operations, and administrative tasks. The system supports multiple boarding houses with separate financial management, while providing centralized oversight capabilities.

### Key Capabilities

- **Multi-Tenant Architecture**: Manage multiple boarding houses independently
- **Student Management**: Complete student lifecycle from applications to enrollment
- **Room & Bed Management**: Detailed room and bed-level occupancy tracking
- **Financial Management**: Double-entry accounting system with comprehensive reporting
- **Payment Processing**: Handle student payments, invoices, and accounts receivable
- **Petty Cash Management**: User-specific petty cash accounts with expense tracking
- **Supplier Management**: Track vendors, accounts payable, and supplier payments
- **Financial Reporting**: Income statements, cash flow reports, balance sheets, and more

---

## Architecture

The system follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Applications                     │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   Main Client │  Branch App  │ Student Portal│  Boss Dashboard │
│   (React)    │   (React)    │   (React)    │   (React)     │
└──────────────┴──────────────┴──────────────┴───────────────┘
                            │
                    ┌───────┴────────┐
                    │   REST API     │
                    │  (Node.js/    │
                    │   Express)    │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │   MySQL        │
                    │   Database     │
                    └────────────────┘
```

### Applications

1. **Main Client** (`/client`): Primary administrative interface for boarding house operations
2. **Branch App** (`/branch`): Branch-specific management interface
3. **Student Portal** (`/student`): Public-facing portal for students to browse and apply
4. **Boss Dashboard** (`/boss`): Centralized oversight dashboard for all boarding houses

---

## Project Structure

```
alamait/
├── server/                 # Backend API Server
│   ├── src/
│   │   ├── app.js         # Express app configuration
│   │   ├── routes/        # API route handlers
│   │   ├── controllers/   # Business logic controllers
│   │   ├── models/        # Database models
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Service layer (email, etc.)
│   │   └── migrations/    # Database migration scripts
│   ├── uploads/           # File upload storage
│   └── scripts/           # Utility and migration scripts
│
├── client/                 # Main Client Application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   └── App.jsx        # Main app component
│
├── branch/                 # Branch Admin Application
│   └── src/
│
├── student/                # Student Portal Application
│   └── src/
│
├── boss/                   # Boss Dashboard Application
│   └── src/
│
└── database_schema.dbml    # Database schema documentation
```

---

## Technology Stack

### Backend

- **Node.js** (v16+)
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** (jsonwebtoken) - Authentication
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **nodemailer** - Email service
- **xlsx** - Excel file processing
- **Swagger** - API documentation

### Frontend

- **React 18** - UI library
- **React Router DOM** - Routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **jsPDF** - PDF generation
- **React Toastify** - Notifications

### Database

- **MySQL** - Relational database
- **48 Tables** - Comprehensive schema
- **71 Foreign Key Relationships** - Data integrity

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- MySQL 8.0 or higher
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file based on `env_template.txt`:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=alamait
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Run database migrations:**
   ```bash
   node src/scripts/runMigrations.js
   ```

5. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Frontend Setup (Main Client)

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint:**
   Update `src/context/Api.jsx` with your API URL:
   ```javascript
   export const BASE_URL = 'http://localhost:5000/api';
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

### Database Schema

The complete database schema is available in `server/database_schema.dbml`. You can:
- Import it into [dbdiagram.io](https://dbdiagram.io) for visualization
- Use it to understand table relationships and structure

To regenerate the schema:
```bash
cd server
node export_database_schema_fast.js
```

---

## Database Schema

### Core Tables

#### Student Management
- `students` - Student information
- `student_enrollments` - Student enrollment records
- `student_account_balances` - Student account balances
- `student_invoices` - Monthly invoices
- `student_applications` - Application records

#### Room Management
- `boarding_houses` - Boarding house information
- `rooms` - Room details
- `beds` - Individual bed assignments
- `room_images` - Room photo storage

#### Financial Management
- `chart_of_accounts` - Chart of accounts (COA)
- `transactions` - All financial transactions
- `journal_entries` - Double-entry journal entries
- `current_account_balances` - Current account balances
- `expenses` - Expense records
- `suppliers` - Supplier/vendor information
- `accounts_payable` - Accounts payable records
- `supplier_payments` - Supplier payment records

#### Petty Cash
- `petty_cash_accounts` - User-specific petty cash accounts
- `petty_cash_transactions` - Petty cash transaction history

#### Users & Authentication
- `users` - System users
- `petty_cash_users` - Petty cash user accounts

#### Reporting
- `account_balance_history` - Historical account balances
- `account_period_balances` - Period-based balance tracking

### Key Relationships

- Students → Enrollments → Invoices → Payments
- Transactions → Journal Entries → Account Balances
- Rooms → Beds → Student Assignments
- Suppliers → Accounts Payable → Payments

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

#### Students
- `GET /students` - List all students
- `POST /students` - Create new student
- `GET /students/:id` - Get student details
- `PUT /students/:id` - Update student
- `GET /students/:id/payments` - Get student payment history

#### Payments
- `POST /payments` - Record payment
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment details

#### Rooms
- `GET /rooms` - List rooms
- `POST /rooms` - Create room
- `PUT /rooms/:id` - Update room
- `POST /rooms/:id/beds` - Assign bed

#### Expenses
- `GET /expenses` - List expenses
- `POST /expenses` - Create expense
- `PUT /expenses/:id` - Update expense

#### Petty Cash
- `POST /petty-cash/add-cash` - Add cash to petty cash account
- `POST /petty-cash/withdraw` - Withdraw from petty cash
- `POST /petty-cash/add-expense` - Record petty cash expense
- `GET /petty-cash/balance` - Get petty cash balance

#### Accounting
- `GET /coa` - Get chart of accounts
- `POST /coa` - Create account
- `GET /trial-balance` - Generate trial balance
- `GET /journal-entries` - List journal entries

#### Reports
- `GET /reports/income-statement` - Generate income statement
- `GET /reports/cashflow` - Generate cash flow report
- `GET /reports/balance-sheet` - Generate balance sheet
- `GET /dashboard/kpis` - Get dashboard KPIs

#### Suppliers
- `GET /suppliers` - List suppliers
- `POST /suppliers` - Create supplier
- `GET /suppliers/:id` - Get supplier details
- `GET /accounts-payable` - List accounts payable

### Complete API Documentation

Swagger API documentation is available at:
```
http://localhost:5000/api-docs
```

---

## Features

### 1. Student Management

- **Student Registration**: Complete student profiles with personal information
- **Application System**: Students can apply for rooms through the portal
- **Enrollment Tracking**: Track student enrollment history and status
- **Account Management**: Individual student account balances
- **Invoice Generation**: Automated monthly invoice generation
- **Payment History**: Complete payment tracking per student

### 2. Room & Bed Management

- **Room Configuration**: Define rooms with capacity, pricing, and amenities
- **Bed-Level Assignment**: Assign students to specific beds within rooms
- **Availability Tracking**: Real-time bed and room availability
- **Room Images**: Photo gallery for each room
- **Multiple Boarding Houses**: Support for multiple properties

### 3. Financial Management

#### Double-Entry Accounting
- **Chart of Accounts**: Customizable account structure
- **Journal Entries**: Automatic double-entry journal creation
- **Account Balances**: Real-time balance tracking
- **Trial Balance**: Generate trial balance reports

#### Cash Management
- **Multiple Cash Accounts**: Cash, CBZ Bank Account, CBZ Vault
- **Petty Cash**: User-specific petty cash accounts
- **Bank Reconciliation**: Reconcile bank statements

#### Accounts Receivable/Payable
- **Accounts Receivable**: Track money owed by students
- **Accounts Payable**: Track money owed to suppliers
- **Payment Processing**: Record and track payments

### 4. Payment Processing

- **Payment Methods**: Cash, Bank Transfer, Mobile Money
- **Automatic Journal Entries**: Payments create proper accounting entries
- **Balance Updates**: Real-time student and account balance updates
- **Receipt Generation**: Payment receipts with references

### 5. Expense Management

- **Expense Categories**: Categorize expenses by account
- **Receipt Upload**: Attach receipts to expenses
- **Supplier Linking**: Link expenses to suppliers
- **Approval Workflow**: Budget request and expenditure approval system

### 6. Petty Cash System

- **User-Specific Accounts**: Each user has their own petty cash account
- **Cash Management**: Add cash, withdraw, and track expenses
- **Expense Recording**: Record petty cash expenses with proper journal entries
- **Balance Tracking**: Real-time petty cash balance per user
- **Reconciliation**: Petty cash reconciliation tools

### 7. Financial Reporting

- **Income Statement**: Revenue and expense reporting
- **Cash Flow Report**: Operating, investing, and financing activities
- **Balance Sheet**: Assets, liabilities, and equity
- **Trial Balance**: Account balance verification
- **Custom Date Ranges**: Filter reports by date period
- **Export Capabilities**: Export reports to Excel/PDF

### 8. Supplier Management

- **Supplier Profiles**: Complete supplier information
- **Accounts Payable**: Track amounts owed to suppliers
- **Payment Tracking**: Record supplier payments
- **Transaction History**: Complete payment history per supplier

### 9. Dashboard & Analytics

- **KPI Cards**: Key financial metrics at a glance
- **Cash Balances**: Separate display of cash accounts
- **Recent Activity**: Latest transactions and updates
- **Visual Charts**: Data visualization with Recharts

### 10. Multi-Tenant Support

- **Boarding House Isolation**: Separate data per boarding house
- **Centralized Oversight**: Boss dashboard for cross-house management
- **Branch Management**: Branch-specific interfaces
- **User Permissions**: Role-based access control

---

## Authentication & Authorization

### User Roles

1. **Admin**: Full system access
2. **Boss**: Centralized oversight across all boarding houses
3. **Branch Administrator (BA)**: Manage specific boarding house
4. **Petty Cash User**: Manage personal petty cash account
5. **Student**: Portal access only

### Authentication Flow

1. User logs in via `/api/auth/login`
2. Server validates credentials
3. JWT token generated with user info and role
4. Token stored client-side (localStorage)
5. Token included in subsequent API requests
6. Middleware validates token on protected routes

### Protected Routes

Most routes require authentication. The `auth.js` middleware:
- Validates JWT token
- Extracts user information
- Attaches user to request object
- Verifies boarding house access (for branch users)

### Boarding House Context

Branch administrators must include `boarding-house-id` header:
```
boarding-house-id: <boarding_house_id>
```

---

## Deployment

### Backend Deployment

1. **Set environment variables:**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_USER=your_production_db_user
   DB_PASSWORD=your_production_db_password
   DB_NAME=alamait_production
   JWT_SECRET=your_production_secret
   PORT=5000
   ```

2. **Install production dependencies:**
   ```bash
   npm install --production
   ```

3. **Run migrations:**
   ```bash
   node src/scripts/runMigrations.js
   ```

4. **Start with PM2:**
   ```bash
   pm2 start src/app.js --name alamait-api
   ```

### Frontend Deployment

1. **Build production bundle:**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder** to your web server (nginx, Apache, etc.)

3. **Configure reverse proxy** to forward API requests to backend

### CORS Configuration

Update CORS origins in `server/src/app.js`:
```javascript
app.use(cors({
  origin: [
    'http://your-production-domain.com',
    'https://your-production-domain.com'
  ],
  credentials: true
}));
```

---

## Development Guidelines

### Code Style

- Use **ES6+** JavaScript features
- Follow **RESTful** API conventions
- Use **async/await** for asynchronous operations
- Implement **error handling** in all controllers

### Database Queries

- Use **parameterized queries** to prevent SQL injection
- Use **transactions** for multi-step operations
- Always handle **connection errors**
- Clean up connections in `finally` blocks

### Frontend Components

- Use **functional components** with hooks
- Implement **loading states** for async operations
- Use **React Context** for global state
- Follow **component composition** patterns

### File Organization

- **Controllers**: Business logic only
- **Routes**: Route definitions only
- **Models**: Database interaction layer
- **Services**: Reusable service functions
- **Middleware**: Request processing logic

### Error Handling

- Use try-catch blocks in async functions
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging

### Testing

- Test API endpoints with tools like Postman
- Verify database state after operations
- Test edge cases and error scenarios

### Database Migrations

- Create migration files in `src/migrations/`
- Use descriptive naming: `YYYYMMDD_description.sql`
- Test migrations on development database first
- Document breaking changes

---

## Key Files & Scripts

### Utility Scripts

- `export_database_schema_fast.js` - Export database schema to DBML
- `runMigrations.js` - Run all pending migrations
- Various correction scripts in root directory

### Configuration Files

- `server/src/app.js` - Main Express application
- `server/.env` - Environment variables
- `client/vite.config.js` - Vite configuration
- `client/tailwind.config.js` - Tailwind CSS configuration

---

## Support & Maintenance

### Common Issues

1. **Database Connection Errors**
   - Verify `.env` file configuration
   - Check MySQL service is running
   - Verify user permissions

2. **CORS Errors**
   - Add frontend URL to CORS origins
   - Verify credentials setting

3. **JWT Token Errors**
   - Check token expiration
   - Verify JWT_SECRET matches
   - Clear localStorage and re-login

4. **File Upload Errors**
   - Check `uploads/` directory permissions
   - Verify multer configuration
   - Check file size limits

### Database Maintenance

- Regular backups recommended
- Monitor query performance
- Review and clean up old transactions
- Update indexes as needed

---

## Version History

- **v1.0.0** - Initial release
  - Multi-tenant boarding house management
  - Complete financial accounting system
  - Student and room management
  - Petty cash system
  - Comprehensive reporting

---

## License

[Specify your license here]

---

## Contact & Support

For questions, issues, or contributions, please contact the development team.

---

**Last Updated**: December 2024

