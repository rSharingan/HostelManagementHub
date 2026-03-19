# Backend Setup Instructions

## Overview
A new Next.js backend with MSSQL database has been created at `backend-nextjs/`. This replaces the simple Express backend with a more production-ready setup.

## Architecture
- **Framework**: Next.js 14 with API Routes
- **Database**: MSSQL Server 2019+
- **ORM/Driver**: mssql npm package
- **Client**: React/Next.js compatible

## Project Structure

```
backend-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   └── init/route.js
│   │   ├── students/
│   │   ├── rooms/
│   │   ├── allocations/
│   │   ├── staff/
│   │   ├── maintenance/
│   │   ├── fees/
│   │   │   ├── invoices/
│   │   │   └── payments/
│   │   └── reports/
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── db/
│   │   ├── connection.js
│   │   └── queries.js
│   └── utils/
│       └── response.js
├── package.json
├── next.config.js
├── .env.example
├── .gitignore
└── README.md
```

## Installation Steps

### 1. Install MSSQL Server (if not already installed)

**Windows:**
- Download SQL Server Express from: https://www.microsoft.com/sql-server/sql-server-downloads
- Or use SQL Server Management Studio (SSMS)

**Alternative - Docker:**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Password123!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:latest
```

### 2. Create Database

Connect to MSSQL and run:
```sql
CREATE DATABASE HostelManagement;
```

### 3. Install Dependencies

```bash
cd backend-nextjs
npm install
```

### 4. Configure Environment

Create `.env.local` file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your MSSQL credentials:
```
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=Password123!
DB_NAME=HostelManagement
```

### 5. Initialize Database

Run the development server:
```bash
npm run dev
```

Then visit: `http://localhost:3000/api/auth/init`

This will:
- Create all database tables
- Insert seed data (users, students, rooms, etc.)

### 6. Start Development

The server is now running on `http://localhost:3000/api`

## Database Tables Created

1. **Users** - Authentication/staff accounts
2. **Students** - Student records
3. **Rooms** - Room inventory
4. **Allocations** - Student room assignments
5. **Staff** - Staff member records
6. **Maintenance** - Maintenance requests
7. **Invoices** - Fee invoices
8. **Payments** - Payment records

## API Endpoints

All endpoints follow REST conventions:

- **Students**: GET/POST /api/students, PUT/DELETE /api/students/[id]
- **Rooms**: GET/POST /api/rooms, PUT/DELETE /api/rooms/[id]
- **Allocations**: GET/POST /api/allocations, PUT/DELETE /api/allocations/[id]
- **Staff**: GET/POST /api/staff, PUT/DELETE /api/staff/[id]
- **Maintenance**: GET/POST /api/maintenance, PUT/DELETE /api/maintenance/[id]
- **Invoices**: GET/POST /api/fees/invoices, PUT/DELETE /api/fees/invoices/[id]
- **Payments**: GET/POST /api/fees/payments, DELETE /api/fees/payments/[id]
- **Reports**: GET /api/reports/occupancy, /dues, /maintenance

## CORS Configuration

CORS is enabled for all origins in `next.config.js`. Frontend can communicate with backend from `http://localhost:5173`.

## Key Features

✅ All CRUD operations for each resource
✅ Automatic database schema creation
✅ Auto-seeding with demo data
✅ Foreign key relationships
✅ Timestamp tracking (createdAt, updatedAt)
✅ Proper error handling
✅ CORS support
✅ Response standardization

## Test the Backend

Use the existing frontend at `http://localhost:5173` or test with curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostel.com","password":"password"}'

# Get students
curl http://localhost:3000/api/students

# Create student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","registrationNumber":"REG-003","department":"Arts"}'
```

## Production Build

```bash
npm run build
npm start
```

## Troubleshooting

**Connection Error**: Verify MSSQL is running and credentials in .env.local are correct

**Port 3000 already in use**: Change port or kill the process using port 3000

**Database not initializing**: Check .env.local configuration and MSSQL server status

## Next Steps

1. Run the frontend: `cd ../frontend && npm run dev`
2. Login with demo credentials: admin@hostel.com / password
3. The frontend will automatically use the new backend

**Note**: The old `/backend` directory can be kept as backup or removed.
