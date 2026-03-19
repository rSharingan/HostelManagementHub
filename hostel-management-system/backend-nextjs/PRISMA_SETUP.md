# Prisma + MSSQL Backend Setup Guide

## Overview
This is a Next.js backend using Prisma ORM with MSSQL LocalDB and Windows Authentication.

## Prerequisites

### 1. MSSQL LocalDB Installation

**Option A: SQL Server Express (Recommended)**
- Download from: https://www.microsoft.com/sql-server/sql-server-downloads
- During installation, select "Express" edition
- Note your instance name (usually `SQLEXPRESS` or default instance)

**Option B: LocalDB (Lightweight)**
```powershell
# Check if LocalDB is installed
SqlLocalDB info

# If not installed, use Visual Studio installer or download MSSQL Express with LocalDB
```

**Option C: Docker (Easiest)**
```powershell
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Password123!" `
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:latest
```

### 2. Create Database

**Using SSMS (SQL Server Management Studio):**
1. Connect to your server
2. Right-click "Databases" → New Database
3. Name: `HostelManagement`
4. Click OK

**Using PowerShell/Command Line:**
```powershell
sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend-nextjs
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Configure Environment

**Create `.env.local` file:**

```bash
cp .env.example .env.local
```

**Edit `.env.local` with your database details:**

**For LocalDB with Integrated Security (Windows Auth):**
```
DATABASE_URL="sqlserver://(localdb)\\mssqllocaldb;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

**For SQL Server Express (Default Instance):**
```
DATABASE_URL="sqlserver://localhost;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

**For SQL Server Express (Named Instance):**
```
DATABASE_URL="sqlserver://localhost\\SQLEXPRESS;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

**For SQL Server with SQL Authentication:**
```
DATABASE_URL="sqlserver://SERVER_ADDRESS;database=HostelManagement;username=sa;password=YOUR_PASSWORD;trustServerCertificate=true;"
```

### 4. Create Database Schema

Use Prisma to create tables:

```bash
npm run db:push
```

This will:
- Create all tables based on `prisma/schema.prisma`
- Set up relationships and constraints
- Create indexes

### 5. Seed Initial Data

```bash
npm run prisma:seed
```

This will insert:
- 4 user accounts (admin, warden, accountant, caretaker)
- 2 students
- 2 rooms
- 1 allocation
- 2 staff members
- 2 maintenance requests
- 2 invoices
- 1 payment

## Start Development Server

```bash
npm run dev
```

Backend will run on: `http://localhost:3000/api`

## Prisma Studio (Database GUI)

View and edit data in a visual interface:

```bash
npm run db:studio
```

Opens at: `http://localhost:5555`

## Key Scripts

```bash
npm run dev                  # Start development server
npm run build               # Build for production
npm start                   # Start production server
npm run prisma:generate     # Generate Prisma Client
npm run db:push             # Push schema to database
npm run prisma:seed         # Run seed file
npm run db:studio           # Open Prisma Studio
```

## Windows Authentication (Integrated Security)

### What is Windows Authentication?

Uses your Windows user account to authenticate to MSSQL. No password prompt needed.

### Requirements

1. **MSSQL Server** must be configured to accept Windows logins
2. **Current Windows user** should have database access
3. **Connection string** must include `integratedSecurity=true`

### Verify Windows Auth is Enabled

```powershell
# Check if Windows Auth is enabled in MSSQL
sqlcmd -S (localdb)\mssqllocaldb -Q "SELECT @@VERSION"
```

### Grant Current User Database Access

If you get permission errors:

```sql
-- In SSMS or sqlcmd, as admin
USE HostelManagement;
CREATE USER [DOMAIN\USERNAME] FROM LOGIN [DOMAIN\USERNAME];
ALTER ROLE db_owner ADD MEMBER [DOMAIN\USERNAME];
```

Replace `DOMAIN\USERNAME` with your Windows username (e.g., `DESKTOP-ABC\John`)

## Troubleshooting

### Connection Error: "Cannot open database"

```
Error: FATAL  -- System.Data.SqlClient.SqlException (0x80131904): 
Cannot open database "HostelManagement" requested by the login.
```

**Solution:** Create the database first
```powershell
sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
```

### Connection Error: "Login failed for user"

```
Error: Login failed for user 'YOUR_USERNAME'. 
The user is not associated with a trusted SQL Server connection.
```

**Solution:** Use Windows Authentication:
```
DATABASE_URL="sqlserver://(localdb)\\mssqllocaldb;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

### Port 3000 Already In Use

```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Prisma Client Not Found

```bash
npm install
npm run prisma:generate
```

### Tables Not Created

```bash
npm run db:push
npm run prisma:seed
```

## Database Schema

### Tables Created

1. **Users** - Authentication accounts
   - id, name, email, password, role, timestamps

2. **Students** - Student records
   - id, name, email, phone, registrationNumber, department, yearOfStudy, status, timestamps

3. **Rooms** - Room inventory
   - id, roomNumber, block, floor, capacity, type, rentalCost, status, timestamps

4. **Allocations** - Room assignments
   - id, studentId, roomId, checkInDate, checkOutDate, status, timestamps

5. **Staff** - Staff members
   - id, name, email, position, department, status, timestamps

6. **Maintenance** - Maintenance requests
   - id, description, room, priority, status, reportedDate, assignedTo, timestamps

7. **Invoices** - Fee invoices
   - id, studentId, amount, dueDate, status, month, year, timestamps

8. **Payments** - Payment records
   - id, invoiceId, studentId, amount, paymentDate, method, reference, timestamps

## API Endpoints

All endpoints follow REST conventions with full CRUD operations:

- `POST /api/auth/login` - Login
- `GET/POST /api/students` - List/create students
- `PUT/DELETE /api/students/[id]` - Update/delete student
- `GET/POST /api/rooms` - List/create rooms
- `PUT/DELETE /api/rooms/[id]` - Update/delete room
- `GET/POST /api/allocations` - List/create allocations
- `PUT/DELETE /api/allocations/[id]` - Update/delete allocation
- `GET/POST /api/staff` - List/create staff
- `PUT/DELETE /api/staff/[id]` - Update/delete staff member
- `GET/POST /api/maintenance` - List/create maintenance
- `PUT/DELETE /api/maintenance/[id]` - Update/delete maintenance
- `GET/POST /api/fees/invoices` - List/create invoices
- `PUT/DELETE /api/fees/invoices/[id]` - Update/delete invoice
- `GET/POST /api/fees/payments` - List/create payments
- `DELETE /api/fees/payments/[id]` - Delete payment
- `GET /api/reports/occupancy` - Occupancy report
- `GET /api/reports/dues` - Dues report
- `GET /api/reports/maintenance` - Maintenance report

## Demo Credentials

All automatically seeded:

```
admin@hostel.com / password (Admin)
warden@hostel.com / password (Warden)
accountant@hostel.com / password (Accountant)
caretaker@hostel.com / password (Caretaker)
```

## Migration & Production

### Create a New Migration

```bash
npm run prisma:migrate
```

Follows this workflow:
1. You modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Name your migration (e.g., `add_user_phone`)
4. Prisma creates migration file and updates database

### Production Build

```bash
npm run build
npm start
```

### Reset Database (Careful!)

```bash
npm run db:push -- --force-reset
npm run prisma:seed
```

## Next Steps

1. ✅ Backend setup complete
2. 🔄 Ensure frontend is pointing to `http://localhost:3000/api`
3. 🚀 Start development:
   ```bash
   npm run dev
   ```

4. 🌐 Access frontend at `http://localhost:5173`
5. 🔐 Login with demo credentials above
6. 📊 Test all API endpoints

## Additional Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Prisma MSSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/sql-server)
- [MSSQL Docs](https://docs.microsoft.com/sql/)
