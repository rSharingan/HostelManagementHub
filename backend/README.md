# Hostel Management Backend (Express + MS SQL Server)

This backend is connected to **MS SQL Server** using `msnodesqlv8`.

## 1. Prerequisites (Windows)

1. Install **Node.js 18+**.
2. Install **Microsoft SQL Server** (Developer or Express).
3. Install **SQL Server Management Studio (SSMS)** (recommended).
4. During SQL Server setup, ensure you know:
   - Instance name (for example `SQLEXPRESS`)
   - Auth mode (Windows auth or SQL auth)

## 2. Create Database and Tables

1. Open SSMS and connect to your SQL Server instance.
2. Open and run `database-setup.sql` from this folder.
3. Confirm these tables exist:
   - `Users`
   - `Students`
   - `Rooms`
   - `Maintenance`
   - `Payments`
   - `RoomRequests`

## 3. Configure Backend Connection

The backend reads these environment variables:

- `PORT` (default: `5000`)
- `DB_SERVER` (default: `.\\SQLEXPRESS`)
- `DB_NAME` (default: `HostelManagement`)
- `DB_TRUSTED_CONNECTION` (default: `true`)
- `DB_USER` (required only if `DB_TRUSTED_CONNECTION=false`)
- `DB_PASSWORD` (required only if `DB_TRUSTED_CONNECTION=false`)

### Docker Runtime (recommended when backend runs in container)

Use SQL login auth from container to SQL Server host:

- `DB_SERVER=host.docker.internal`
- `DB_NAME=HostelManagement`
- `DB_TRUSTED_CONNECTION=false`
- `DB_USER=sa`
- `DB_PASSWORD=<your-password>`

Why: Windows Trusted Connection usually fails from inside containers.

### Option A: Windows Authentication (recommended on local Windows)

PowerShell example:

```powershell
$env:DB_SERVER = '.\SQLEXPRESS'
$env:DB_NAME = 'HostelManagement'
$env:DB_TRUSTED_CONNECTION = 'true'
```

### Option B: SQL Login Authentication

PowerShell example:

```powershell
$env:DB_SERVER = '.\SQLEXPRESS'
$env:DB_NAME = 'HostelManagement'
$env:DB_TRUSTED_CONNECTION = 'false'
$env:DB_USER = 'sa'
$env:DB_PASSWORD = 'yourStrongPasswordHere'
```

## 4. Install and Run

```powershell
npm.cmd install
npm.cmd run dev
```

Notes:
- Use `npm.cmd` on this machine to avoid PowerShell script policy issues.
- Backend base URL: `http://localhost:5000/api`

## 5. Verify DB Connectivity

After server starts, test:

- `GET http://localhost:5000/api/health/db`

Expected:

```json
{ "ok": true, "message": "Database connected" }
```

## 5.1 Auto Table Creation

On backend startup, schema creation runs automatically and creates these tables if missing:

- `Users`
- `Students`
- `Rooms`
- `Maintenance`
- `Payments`
- `RoomRequests`

If startup reaches `Database schema verified`, table setup succeeded.

## 6. Frontend Integration

Frontend should point to:

- `VITE_API_BASE_URL=http://localhost:5000/api`

In this workspace, frontend constants already default to that URL.

## 7. Common Issues

1. Login works but protected routes fail:
   - Make sure frontend sends `Authorization: Bearer <token>`.
2. `Database connection failed`:
   - Verify SQL Server service is running.
   - Verify `DB_SERVER` instance name (for example `.\SQLEXPRESS`, `localhost`, or `MACHINE\\SQLEXPRESS`).
3. `Cannot open database`:
   - Confirm `HostelManagement` DB exists.
4. Native driver issues:
   - Re-run `npm.cmd install` in this backend folder.

## 8. Key API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/health/db`
- `GET /api/students`
- `GET /api/rooms`
- `POST /api/rooms/:id/apply`
- `GET /api/room-requests`
- `PUT /api/room-requests/:id/approve`
