# Hostel Management System Backend

Next.js backend with **Prisma ORM** and **MSSQL** database for Hostel Management System.

## Tech Stack

- **Framework**: Next.js 14 with API Routes
- **ORM**: Prisma (type-safe database access)
- **Database**: MSSQL Server / LocalDB
- **Authentication**: Windows Authentication (Integrated Security)
- **Language**: JavaScript/Node.js

## Quick Start

### 1. Install Dependencies

```bash
cd backend-nextjs
npm install
npm run prisma:generate
```

### 2. Configure Database

Create `.env.local`:

```bash
cp .env.example .env.local
```

**For LocalDB with Windows Auth:**
```
DATABASE_URL="sqlserver://(localdb)\\mssqllocaldb;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

### 3. Setup Database

```bash
npm run db:push
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Backend runs on: **http://localhost:3000/api**

## Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:push` | Create/update database schema |
| `npm run prisma:seed` | Insert seed data |
| `npm run db:studio` | Open Prisma Studio (visual database editor) |

## Database Setup

### Windows Authentication

Uses your current Windows user credentials - no password needed!

Requirements:
- MSSQL Server or LocalDB installed
- Windows user has database access

### Create Database

```powershell
# Using sqlcmd
sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/[id]` - Get room details
- `PUT /api/rooms/[id]` - Update room
- `DELETE /api/rooms/[id]` - Delete room

### Room Allocations
- `GET /api/allocations` - List allocations
- `POST /api/allocations` - Create allocation
- `GET /api/allocations/[id]` - Get allocation details
- `PUT /api/allocations/[id]` - Update allocation
- `DELETE /api/allocations/[id]` - Delete allocation

### Staff
- `GET /api/staff` - List staff
- `POST /api/staff` - Create staff member
- `GET /api/staff/[id]` - Get staff details
- `PUT /api/staff/[id]` - Update staff
- `DELETE /api/staff/[id]` - Delete staff

### Maintenance
- `GET /api/maintenance` - List requests
- `POST /api/maintenance` - Create request
- `GET /api/maintenance/[id]` - Get request details
- `PUT /api/maintenance/[id]` - Update request
- `DELETE /api/maintenance/[id]` - Delete request

### Fees & Payments
- `GET/POST /api/fees/invoices` - Manage invoices
- `GET/POST /api/fees/payments` - Manage payments

### Reports
- `GET /api/reports/occupancy` - Room occupancy statistics
- `GET /api/reports/dues` - Outstanding fees report
- `GET /api/reports/maintenance` - Maintenance summary

## Demo Credentials

```
Admin: admin@hostel.com / password
Warden: warden@hostel.com / password
Accountant: accountant@hostel.com / password
Caretaker: caretaker@hostel.com / password
```

## Database Schema

8 main tables:
- **Users** - Staff & admin accounts
- **Students** - Student records
- **Rooms** - Room inventory
- **Allocations** - Student room assignments
- **Staff** - Staff members
- **Maintenance** - Maintenance requests
- **Invoices** - Fee invoices
- **Payments** - Payment records

All tables include `createdAt` and `updatedAt` timestamps.

## Key Features

✅ **Type-Safe ORM** - Prisma with TypeScript support  
✅ **Migrations** - Version-controlled database changes  
✅ **Relationships** - Foreign keys and relational data  
✅ **Windows Auth** - Integrated Security for MSSQL  
✅ **REST API** - Complete CRUD operations  
✅ **Error Handling** - Comprehensive error responses  
✅ **Seeding** - Auto-populated demo data  
✅ **Prisma Studio** - Visual database explorer  

## Detailed Setup Guide

See [PRISMA_SETUP.md](PRISMA_SETUP.md) for:
- MSSQL installation options
- Windows Authentication setup
- Troubleshooting guide
- Migration examples
- Production deployment

## Project Structure

```
backend-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/login
│   │   ├── students/
│   │   ├── rooms/
│   │   ├── allocations/
│   │   ├── staff/
│   │   ├── maintenance/
│   │   ├── fees/
│   │   └── reports/
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── db/prisma.js
│   └── utils/response.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── package.json
└── .env.example
```

## CORS Configuration

CORS is enabled in `next.config.js` to allow requests from:
- Frontend: `http://localhost:5173`
- Any origin (configurable)

## Environment Variables

Create `.env.local` with your database connection:

```env
# MSSQL Connection
DATABASE_URL="sqlserver://..."

# Optional
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

See `.env.example` for all options.

## Common Tasks

### Reset Database

```bash
npm run db:push -- --force-reset
npm run prisma:seed
```

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Create a Migration

```bash
# Modify prisma/schema.prisma
npm run prisma:migrate
# Follow prompts to name migration
```

## Testing API

Using curl:

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

## Production Deployment

```bash
npm run build
npm start
```

## Support

For issues, refer to:
- [Prisma Documentation](https://www.prisma.io/docs/)
- [MSSQL Documentation](https://docs.microsoft.com/sql/)
- [PRISMA_SETUP.md](PRISMA_SETUP.md) - Detailed setup guide

