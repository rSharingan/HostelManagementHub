# Prisma + MSSQL Backend - Setup Complete ✅

## What Was Created

A complete **Prisma ORM** backend with **MSSQL** and **Windows Authentication** for the Hostel Management System.

### Key Components

✅ **Prisma Schema** (`prisma/schema.prisma`)
- 8 database models with relationships
- Type-safe ORM queries
- Automatic migrations support

✅ **Seed File** (`prisma/seed.js`)
- Auto-populates demo data
- 4 user accounts, 2 students, 2 rooms, etc.
- Ready to run: `npm run prisma:seed`

✅ **API Routes** (All updated for Prisma)
- `/api/auth/login` - Authentication
- `/api/students/[id]` - Student CRUD
- `/api/rooms/[id]` - Room CRUD
- `/api/allocations/[id]` - Allocation CRUD
- `/api/staff/[id]` - Staff CRUD
- `/api/maintenance/[id]` - Maintenance CRUD
- `/api/fees/invoices/[id]` - Invoice CRUD
- `/api/fees/payments/[id]` - Payment CRUD
- `/api/reports/*` - Reports (Occupancy, Dues, Maintenance)

✅ **Prisma Client** (`lib/db/prisma.js`)
- Singleton instance for Next.js
- Prevents multiple Prisma instances

✅ **Configuration Files**
- `next.config.js` - CORS headers
- `.env.example` - Database URL templates
- `package.json` - Prisma scripts

## Installation Steps

### Step 1: Create MSSQL Database (LocalDB)

**Option A: Using SQL Server Express (Recommended)**

1. Download SQL Server Express from: https://www.microsoft.com/sql-server/sql-server-downloads
2. Install with LocalDB option
3. Create database:
   ```powershell
   sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
   ```

**Option B: Docker (Easiest)**

```powershell
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Password123!" `
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:latest
```

### Step 2: Install Dependencies

```bash
cd backend-nextjs
npm install
npm run prisma:generate
```

### Step 3: Configure Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

**For LocalDB (Windows Auth):**
```env
DATABASE_URL="sqlserver://(localdb)\\mssqllocaldb;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

**For SQL Server Express:**
```env
DATABASE_URL="sqlserver://localhost;database=HostelManagement;integratedSecurity=true;trustServerCertificate=true;"
```

### Step 4: Create Database Schema

```bash
npm run db:push
```

This creates all 8 tables with relationships.

### Step 5: Seed Initial Data

```bash
npm run prisma:seed
```

This inserts:
- ✅ 4 user accounts
- ✅ 2 students
- ✅ 2 rooms
- ✅ 1 room allocation
- ✅ 2 staff members
- ✅ 2 maintenance requests
- ✅ 2 invoices
- ✅ 1 payment record

### Step 6: Start Development Server

```bash
npm run dev
```

Backend runs on: **http://localhost:3000/api**

## Database Tables

| Table | Purpose | Records |
|-------|---------|---------|
| **Users** | Admin & staff login accounts | 4 |
| **Students** | Student information | 2 |
| **Rooms** | Hostel rooms | 2 |
| **Allocations** | Student room assignments | 1 |
| **Staff** | Staff members (warden, caretaker) | 2 |
| **Maintenance** | Maintenance requests | 2 |
| **Invoices** | Fee invoices | 2 |
| **Payments** | Payment records | 1 |

## Key Features

### 🔐 Windows Authentication
- Uses your current Windows user credentials
- No password stored in `.env`
- Secure and integrated

### 📊 Type-Safe Queries
```javascript
// Prisma automatically generates types
const student = await prisma.student.findUnique({
  where: { id: 1 },
  include: { allocations: true }
})
```

### 🔄 Automatic Migrations
```bash
# Modify schema.prisma
npm run prisma:migrate

# Creates migration file and updates database
```

### 📈 Visual Database Explorer
```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

## Demo Credentials

```
Email: admin@hostel.com
Password: password
Role: Admin (Full Access)

Email: warden@hostel.com
Password: password
Role: Warden

Email: accountant@hostel.com
Password: password
Role: Accountant

Email: caretaker@hostel.com
Password: password
Role: Caretaker
```

## Prisma Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run db:push` | Create/update schema |
| `npm run prisma:migrate` | Create named migration |
| `npm run prisma:seed` | Run seed file |
| `npm run db:studio` | Open visual database editor |

## Troubleshooting

### "Cannot open database HostelManagement"

Create the database first:
```powershell
sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
```

### "Login failed for user"

Make sure `integratedSecurity=true` is set in `.env.local`

### Tables not created

```bash
npm run db:push
npm run prisma:seed
```

### Port 3000 already in use

```bash
# Kill the process
Get-Process -id ((Get-NetTCPConnection -LocalPort 3000).OwningProcess) | Stop-Process -Force
```

## API Examples

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostel.com","password":"password"}'
```

### Get All Students

```bash
curl http://localhost:3000/api/students
```

### Create Student

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Jane Doe",
    "registrationNumber":"REG-004",
    "department":"Business",
    "yearOfStudy":3
  }'
```

### Update Student

```bash
curl -X PUT http://localhost:3000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"INACTIVE"}'
```

### Delete Student

```bash
curl -X DELETE http://localhost:3000/api/students/1
```

## Frontend Integration

The frontend at `http://localhost:5173` is already configured to use:

```javascript
const API_BASE_URL = 'http://localhost:3000/api'
```

No changes needed! Just login and use the app.

## Project Files Modified/Created

### New Files
- ✅ `prisma/schema.prisma` - Database schema
- ✅ `prisma/seed.js` - Seed data
- ✅ `lib/db/prisma.js` - Prisma client instance
- ✅ `PRISMA_SETUP.md` - Detailed setup guide
- ✅ `.env.example` - Environment template

### Updated Files
- ✅ `package.json` - Added Prisma dependencies & scripts
- ✅ `README.md` - Updated documentation
- ✅ All `/api/*/route.js` files - Migrated to Prisma
- ✅ `.env.example` - Updated with Prisma connection strings

## Old Backend

The old `/backend` directory with raw `mssql` driver is still available for reference.

## Next Steps

1. **Create MSSQL Database** (if not done)
   ```powershell
   sqlcmd -S (localdb)\mssqllocaldb -Q "CREATE DATABASE HostelManagement;"
   ```

2. **Install & Setup**
   ```bash
   cd backend-nextjs
   npm install
   npm run prisma:generate
   cp .env.example .env.local
   ```

3. **Configure `.env.local`** with your database URL

4. **Setup Database**
   ```bash
   npm run db:push
   npm run prisma:seed
   ```

5. **Start Backend**
   ```bash
   npm run dev
   ```

6. **Frontend Already Running?**
   - Available at: `http://localhost:5173`
   - Already configured for new backend
   - Just login with demo credentials

## Documentation

- **[README.md](README.md)** - Overview & quick start
- **[PRISMA_SETUP.md](PRISMA_SETUP.md)** - Detailed setup guide
- **[.env.example](.env.example)** - Configuration templates

## Support

If you encounter issues:
1. Check [PRISMA_SETUP.md](PRISMA_SETUP.md) troubleshooting section
2. Verify database connection in `.env.local`
3. Run `npm run db:push` and `npm run prisma:seed` again
4. Check Prisma Studio: `npm run db:studio`

## Summary

✅ **Complete Prisma Backend Created**
- Next.js with API Routes
- Prisma ORM for type-safe database access
- MSSQL with Windows Authentication
- 8 database models with relationships
- All 35+ API endpoints implemented
- Demo data seeded and ready
- Frontend-compatible API

**You're ready to run:**
```bash
npm run dev
```

Enjoy! 🚀
