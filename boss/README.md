# Boss Dashboard

A comprehensive management dashboard for overseeing all boarding houses and operations in the Alamait system.

## Features

- **Global Overview**: Monitor all boarding houses from a single dashboard
- **Student Management**: View and manage students across all locations
- **Financial Reports**: Access comprehensive financial reports
- **Accounting**: Manage chart of accounts, trial balance, and accounts payable
- **Supplier Management**: Oversee all suppliers and vendors
- **System Settings**: Configure system-wide settings and preferences

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to the Alamait API server

### Installation

1. Navigate to the boss directory:
   ```bash
   cd boss
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the boss directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (default Vite port)

### Building for Production

```bash
npm run build
```

## Authentication

The Boss Dashboard requires users with `boss` or `admin` role privileges. Regular users will be denied access.

## Pages

- **Dashboard**: Overview of all system metrics
- **All Boarding Houses**: Manage all boarding houses
- **All Students**: View students across all locations
- **All Rooms**: Room management across all houses
- **All Suppliers**: Supplier and vendor management
- **All Users**: User management and permissions
- **Accounting Overview**: Financial management tools
- **All Reports**: Comprehensive reporting system
- **System Settings**: System configuration and preferences

## Technology Stack

- React 19
- React Router DOM
- Axios
- Vite
- Custom CSS (no external UI library)

## API Integration

The Boss Dashboard integrates with the Alamait API server to fetch data from all boarding houses. Make sure the API server is running and accessible.

## Development

The application uses Vite for fast development and hot module replacement. All components are built with React and styled with custom CSS.

## License

This project is part of the Alamait boarding house management system.