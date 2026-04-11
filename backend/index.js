import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

function getConnectionString() {
  const server = process.env.DB_SERVER || 'localhost';
  const database = process.env.DB_NAME || 'HostelManagement';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const useTrusted = String(process.env.DB_TRUSTED_CONNECTION || 'false').toLowerCase() === 'true';

  if (useTrusted) {
    return `Driver={SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
  }

  if (user && password) {
    return `Driver={SQL Server};Server=${server};Database=${database};Uid=${user};Pwd=${password};TrustServerCertificate=yes;`;
  }

  return `Driver={SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
}

// Get fallback connection string for Windows authentication
function getFallbackConnectionString() {
  const server = process.env.DB_SERVER || 'localhost';
  const database = process.env.DB_NAME || 'HostelManagement';
  return `Driver={SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
}

let connectionString = getConnectionString();
let fallbackConnectionString = getFallbackConnectionString();

app.use(cors());
app.use(express.json());

// Database connection
let conn;

async function connectDB() {
  // Try primary connection first
  try {
    console.log('📡 Attempting primary connection with credentials...');
    conn = await new Promise((resolve, reject) => {
      sql.open(connectionString, (err, db) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
    console.log('✅ Connected with primary credentials');
    return true;
  } catch (primaryErr) {
    console.log('⚠️  Primary connection failed, attempting Windows authentication fallback...');
    
    // Try fallback with Windows authentication
    try {
      conn = await new Promise((resolve, reject) => {
        sql.open(fallbackConnectionString, (err, db) => {
          if (err) reject(err);
          else resolve(db);
        });
      });
      console.log('✅ Connected with Windows authentication (Trusted Connection)');
      return true;
    } catch (fallbackErr) {
      console.error('❌ Both connection methods failed');
      console.error('Primary error:', primaryErr.message);
      console.error('Fallback error:', fallbackErr.message);
      console.error('Please check:');
      console.error('  1. SQL Server is running');
      console.error('  2. Database "HostelManagement" exists');
      console.error('  3. Either SQL credentials OR Windows auth is configured');
      return false;
    }
  }
}

// Simple query helper
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function ensureColumnExists(table, column, definition) {
  await query(`
    IF COL_LENGTH('dbo.${table}', '${column}') IS NULL
    BEGIN
      ALTER TABLE dbo.${table} ADD ${definition}
    END
  `);
}

async function ensureForeignKey(constraintName, table, definition) {
  await query(`
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = '${constraintName}')
    BEGIN
      ALTER TABLE dbo.${table} ADD CONSTRAINT ${constraintName} ${definition}
    END
  `);
}

function toNullableInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const match = String(value).match(/-?\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function toIntOrDefault(value, fallback) {
  const parsed = toNullableInt(value);
  return parsed === null ? fallback : parsed;
}

function toBit(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    return value ? 1 : 0;
  }

  const normalized = String(value).toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return 1;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return 0;
  }

  return fallback;
}

function getRowId(row) {
  if (!row) {
    return null;
  }

  return row.id ?? row.Id ?? row.ID ?? row.IDENTIFIER ?? null;
}

async function getRoomById(roomId) {
  const result = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
  return result && result.length > 0 ? result[0] : null;
}

async function getStudentByEmail(email) {
  if (!email) {
    return null;
  }

  const result = await query('SELECT TOP 1 * FROM Students WHERE email = ?', [email]);
  return result && result.length > 0 ? result[0] : null;
}

async function getActiveAllocationForStudent(studentId) {
  if (!studentId) {
    return null;
  }

  const result = await query(
    `SELECT TOP 1 a.*, r.roomNumber, r.rentalCost, r.id AS resolvedRoomId
     FROM Allocations a
     LEFT JOIN Rooms r ON a.roomId = r.id
     WHERE a.studentId = ? AND a.status = 'ACTIVE'
     ORDER BY a.checkInDate DESC, a.id DESC`,
    [studentId]
  );

  return result && result.length > 0 ? result[0] : null;
}

async function ensureBedsForRoom(roomId, capacity) {
  const existingBeds = await query('SELECT COUNT(*) AS count FROM Beds WHERE roomId = ?', [roomId]);
  const existingCount = Number(existingBeds?.[0]?.count || 0);
  const targetCount = Math.max(0, Number(capacity || 0));

  for (let bedNumber = existingCount + 1; bedNumber <= targetCount; bedNumber += 1) {
    await query('INSERT INTO Beds (roomId, bedNumber, status) VALUES (?, ?, ?)', [roomId, bedNumber, 'AVAILABLE']);
  }
}

async function getAvailableBed(roomId, maxBedNumber = null) {
  const sqlText = maxBedNumber
    ? 'SELECT TOP 1 * FROM Beds WHERE roomId = ? AND status = ? AND bedNumber <= ? ORDER BY bedNumber ASC'
    : 'SELECT TOP 1 * FROM Beds WHERE roomId = ? AND status = ? ORDER BY bedNumber ASC';
  const params = maxBedNumber ? [roomId, 'AVAILABLE', maxBedNumber] : [roomId, 'AVAILABLE'];
  const result = await query(sqlText, params);
  if (!result || result.length === 0) {
    return null;
  }

  const bed = result[0];
  return { ...bed, id: getRowId(bed) };
}

async function syncRoomStatus(roomId) {
  const room = await getRoomById(roomId);
  if (!room) {
    return;
  }

  const occupiedBeds = await query('SELECT COUNT(*) AS count FROM Beds WHERE roomId = ? AND status = ?', [roomId, 'OCCUPIED']);
  const occupancy = Number(occupiedBeds?.[0]?.count || 0);
  const newStatus = occupancy >= room.capacity ? 'OCCUPIED' : 'AVAILABLE';
  await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);

  if (newStatus === 'OCCUPIED') {
    await query('DELETE FROM RoomRequests WHERE roomId = ? AND status = ?', [roomId, 'PENDING']);
  }
}

async function seedBedsForAllRooms() {
  const rooms = await query('SELECT id, capacity FROM Rooms');
  for (const room of rooms) {
    await ensureBedsForRoom(room.id, room.capacity);
  }
}

async function closeActiveStayRecord(studentId, bedId) {
  await query(
    'UPDATE StayRecords SET checkOutDate = GETDATE(), status = ? WHERE studentId = ? AND bedId = ? AND status = ?',
    ['COMPLETED', studentId, bedId, 'ACTIVE']
  );
}

async function ensureFeatureTables() {
  await query(`
    IF OBJECT_ID('dbo.Hostels', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Hostels (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(255) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'WARDEN', 'ACCOUNTANT', 'CARETAKER', 'STUDENT')),
        hostelId INT NULL
      )
    END
  `)

  await ensureColumnExists('Users', 'hostelId', 'hostelId INT NULL')

  await query(`
    IF OBJECT_ID('dbo.Students', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Students (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20) NULL,
        registrationNumber NVARCHAR(50) NULL,
        department NVARCHAR(100) NULL,
        yearOfStudy INT NOT NULL DEFAULT 1,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        password NVARCHAR(255) NOT NULL
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Rooms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        roomNumber NVARCHAR(50) NOT NULL,
        block NVARCHAR(50) NULL,
        floor INT NULL,
        capacity INT NOT NULL DEFAULT 1,
        type NVARCHAR(100) NULL,
        hasAC BIT NOT NULL DEFAULT 0,
        hasAttachedBathroom BIT NOT NULL DEFAULT 0,
        hasWifi BIT NOT NULL DEFAULT 0,
        hasBalcony BIT NOT NULL DEFAULT 0,
        rentalCost DECIMAL(10,2) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        hostelId INT NULL
      )
    END
  `)

  await ensureColumnExists('Rooms', 'hostelId', 'hostelId INT NULL')
  await ensureColumnExists('Rooms', 'hasAC', 'hasAC BIT NOT NULL DEFAULT 0')
  await ensureColumnExists('Rooms', 'hasAttachedBathroom', 'hasAttachedBathroom BIT NOT NULL DEFAULT 0')
  await ensureColumnExists('Rooms', 'hasWifi', 'hasWifi BIT NOT NULL DEFAULT 0')
  await ensureColumnExists('Rooms', 'hasBalcony', 'hasBalcony BIT NOT NULL DEFAULT 0')

  await query(`
    IF OBJECT_ID('dbo.Allocations', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Allocations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        roomId INT NOT NULL,
        bedId INT NULL,
        checkInDate DATETIME2 DEFAULT GETDATE(),
        checkOutDate DATETIME2 NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        FOREIGN KEY (studentId) REFERENCES dbo.Students(id),
        FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)
      )
    END
  `)

  await ensureColumnExists('Allocations', 'bedId', 'bedId INT NULL')

  await query(`
    IF OBJECT_ID('dbo.Beds', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Beds (
        id INT IDENTITY(1,1) PRIMARY KEY,
        roomId INT NOT NULL,
        bedNumber INT NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.StayRecords', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StayRecords (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        bedId INT NOT NULL,
        checkInDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        checkOutDate DATETIME2 NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        FOREIGN KEY (studentId) REFERENCES dbo.Students(id),
        FOREIGN KEY (bedId) REFERENCES dbo.Beds(id)
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.Allocations', 'U') IS NOT NULL AND COL_LENGTH('dbo.Allocations', 'checkOutDate') IS NULL
    BEGIN
      ALTER TABLE dbo.Allocations ADD checkOutDate DATETIME2 NULL
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.RoomRequests', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RoomRequests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        roomId INT NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        requestedDate DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (studentId) REFERENCES dbo.Students(id),
        FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)
      )
    END
  `)

  // Backward compatibility: older manual scripts used requestDate instead of requestedDate.
  await ensureColumnExists('RoomRequests', 'requestedDate', 'requestedDate DATETIME2 DEFAULT GETDATE()')
  await ensureColumnExists('RoomRequests', 'requestDate', 'requestDate DATETIME2 NOT NULL DEFAULT GETDATE()')

  await query(`
    IF OBJECT_ID('dbo.OccupancyReport', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.OccupancyReport (
        id INT IDENTITY(1,1) PRIMARY KEY,
        roomId INT NOT NULL,
        occupiedBeds INT NOT NULL,
        totalBeds INT NOT NULL,
        reportDate DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.Maintenance', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Maintenance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        description NVARCHAR(MAX) NOT NULL,
        room NVARCHAR(50) NULL,
        roomId INT NULL,
        studentId INT NULL,
        staffId INT NULL,
        priority NVARCHAR(50) DEFAULT 'MEDIUM',
        status NVARCHAR(50) DEFAULT 'PENDING',
        reportedDate DATETIME2 NOT NULL,
        assignedTo INT NULL
      )
    END
  `)

  await ensureColumnExists('Maintenance', 'roomId', 'roomId INT NULL')
  await ensureColumnExists('Maintenance', 'studentId', 'studentId INT NULL')
  await ensureColumnExists('Maintenance', 'staffId', 'staffId INT NULL')
  await ensureColumnExists('Maintenance', 'assignedById', 'assignedById INT NULL')
  await ensureColumnExists('Maintenance', 'assignedDate', 'assignedDate DATETIME2 NULL')
  await ensureColumnExists('Maintenance', 'resolvedById', 'resolvedById INT NULL')
  await ensureColumnExists('Maintenance', 'resolvedDate', 'resolvedDate DATETIME2 NULL')
  await ensureColumnExists('Maintenance', 'studentApprovalStatus', "studentApprovalStatus NVARCHAR(50) NOT NULL DEFAULT 'PENDING'")
  await ensureColumnExists('Maintenance', 'studentApprovedById', 'studentApprovedById INT NULL')
  await ensureColumnExists('Maintenance', 'studentApprovedDate', 'studentApprovedDate DATETIME2 NULL')

  await query(`
    IF OBJECT_ID('dbo.Payments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Payments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        invoiceId INT NULL,
        studentId INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paymentDate DATETIME2 NOT NULL,
        method NVARCHAR(50) DEFAULT 'CASH',
        reference NVARCHAR(100) NULL
      )
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.Invoices', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Invoices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        dueDate DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        description NVARCHAR(255) NULL
      )
    END
  `)

  await query(
    `IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = ?)
     BEGIN
       INSERT INTO dbo.Users (name, email, password, role)
       VALUES (?, ?, ?, ?)
     END`,
    ['admin@hostel.com', 'Admin', 'admin@hostel.com', 'password', 'ADMIN']
  )

  await query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.Hostels WHERE id = 1)
    BEGIN
      SET IDENTITY_INSERT dbo.Hostels ON;
      INSERT INTO dbo.Hostels (id, name, address, status) VALUES (1, 'Main Hostel', NULL, 'ACTIVE');
      SET IDENTITY_INSERT dbo.Hostels OFF;
    END
  `)

  await query(`
    UPDATE dbo.Rooms SET hostelId = 1 WHERE hostelId IS NULL
  `)

  await query(`
    UPDATE dbo.Users SET hostelId = 1 WHERE hostelId IS NULL AND role IN ('ADMIN', 'WARDEN', 'ACCOUNTANT', 'CARETAKER')
  `)

  await ensureForeignKey('FK_Users_Hostels', 'Users', 'FOREIGN KEY (hostelId) REFERENCES dbo.Hostels(id)')
  await ensureForeignKey('FK_Rooms_Hostels', 'Rooms', 'FOREIGN KEY (hostelId) REFERENCES dbo.Hostels(id)')
  await ensureForeignKey('FK_Beds_Rooms', 'Beds', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')
  await ensureForeignKey('FK_StayRecords_Students', 'StayRecords', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_StayRecords_Beds', 'StayRecords', 'FOREIGN KEY (bedId) REFERENCES dbo.Beds(id)')
  await ensureForeignKey('FK_Allocations_Beds', 'Allocations', 'FOREIGN KEY (bedId) REFERENCES dbo.Beds(id)')
  await ensureForeignKey('FK_RoomRequests_Students', 'RoomRequests', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_RoomRequests_Rooms', 'RoomRequests', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')
  await ensureForeignKey('FK_Payments_Students', 'Payments', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_Maintenance_Students', 'Maintenance', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_Maintenance_Staff', 'Maintenance', 'FOREIGN KEY (staffId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_Maintenance_Rooms', 'Maintenance', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')

  await seedBedsForAllRooms()
}

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, ...extra } = req.body;

    // Check if user already exists
    const existing = await query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert user
    await query('INSERT INTO Users (name, email, password, role, hostelId) VALUES (?, ?, ?, ?, ?)', [name, email, password, role, role === 'STUDENT' ? null : 1]);

    // Add to respective tables
    if (role === 'STUDENT') {
      await query(
        'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, extra.phone || '', extra.registrationNumber || '', extra.department || '', extra.yearOfStudy || 1, 'ACTIVE', password]
      );
    }

    res.status(201).json({ token: `token-${Date.now()}`, user: { name, email, role } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await query('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password]);

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    return res.json({ token: `token-${user.id}-${Date.now()}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, current password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const userRows = await query('SELECT TOP 1 * FROM Users WHERE email = ?', [email]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    await query('UPDATE Users SET password = ? WHERE email = ?', [newPassword, email]);
    await query('UPDATE Students SET password = ? WHERE email = ?', [newPassword, email]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    res.json({ id: 1, name: 'Admin', email: 'admin@hostel.com', role: 'ADMIN' });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/health/db', async (req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ ok: true, message: 'Database connected' });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ ok: false, message: 'Database not connected' });
  }
});

// Students CRUD
app.get('/api/students', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Students');
    res.json(result);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Students WHERE id = ?', [Number(req.params.id)]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const payload = req.body;
    const yearOfStudy = toIntOrDefault(payload.yearOfStudy, 1);
    await query(
      'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.name, payload.email, payload.phone || '', payload.registrationNumber || '', payload.department || '', yearOfStudy, payload.status || 'ACTIVE', payload.password || 'password']
    );
    const insertedStudent = await query('SELECT TOP 1 * FROM Students WHERE email = ? ORDER BY id DESC', [payload.email]);
    res.status(201).json({ ...(insertedStudent && insertedStudent[0] ? insertedStudent[0] : payload), yearOfStudy });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const yearOfStudy = toIntOrDefault(payload.yearOfStudy, 1);
    await query(
      `UPDATE Students
       SET name = ?, email = ?, phone = ?, registrationNumber = ?, department = ?, yearOfStudy = ?, status = ?, password = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone || '',
        payload.registrationNumber || '',
        payload.department || '',
        yearOfStudy,
        payload.status || 'ACTIVE',
        payload.password || 'password',
        id,
      ]
    );
    res.json({ ...payload, id, yearOfStudy });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM StayRecords WHERE studentId = ?', [id]);
    await query('DELETE FROM Allocations WHERE studentId = ?', [id]);
    await query('DELETE FROM RoomRequests WHERE studentId = ?', [id]);
    await query('DELETE FROM Maintenance WHERE studentId = ?', [id]);
    await query('DELETE FROM Payments WHERE studentId = ?', [id]);
    await query('DELETE FROM Invoices WHERE studentId = ?', [id]);
    await query('DELETE FROM Students WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rooms CRUD
app.get('/api/rooms', async (req, res) => {
  try {
    // Get rooms with their allocations. Use a single allocations fetch to avoid concurrent queries on one connection.
    const rooms = await query('SELECT * FROM Rooms');
    const allocationRows = await query(`
      SELECT a.id, a.studentId, a.roomId, a.checkInDate, a.status as allocationStatus,
             s.name as studentName, s.registrationNumber
      FROM Allocations a
      JOIN Students s ON a.studentId = s.id
      WHERE a.status = 'ACTIVE'
    `);

    const roomsWithAllocations = [];
    for (const room of rooms) {
      const allocations = allocationRows.filter((a) => a.roomId === room.id);
      const currentOccupancy = allocations.length;
      const computedStatus = currentOccupancy >= room.capacity ? 'OCCUPIED' : 'AVAILABLE';
      const seatsLeft = Math.max(0, Number(room.capacity || 0) - currentOccupancy);

      if (room.status !== computedStatus) {
        await query('UPDATE Rooms SET status = ? WHERE id = ?', [computedStatus, room.id]);
      }

      roomsWithAllocations.push({
        ...room,
        status: computedStatus,
        occupiedSeats: currentOccupancy,
        seatsLeft,
        allocatedStudents: allocations.map((a) => ({
          id: a.studentId,
          name: a.studentName,
          registrationNumber: a.registrationNumber,
          allocationId: a.id,
          checkInDate: a.checkInDate,
        })),
      });
    }
    
    res.json(roomsWithAllocations);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const payload = req.body;
    const floor = toNullableInt(payload.floor);
    const hostelId = toIntOrDefault(payload.hostelId, 1);
    const hasAC = toBit(payload.hasAC, 0);
    const hasAttachedBathroom = toBit(payload.hasAttachedBathroom, 0);
    const hasWifi = toBit(payload.hasWifi, 0);
    const hasBalcony = toBit(payload.hasBalcony, 0);
    await query(
      'INSERT INTO Rooms (roomNumber, block, floor, capacity, type, hasAC, hasAttachedBathroom, hasWifi, hasBalcony, rentalCost, status, hostelId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.roomNumber, payload.block, floor, payload.capacity, payload.type, hasAC, hasAttachedBathroom, hasWifi, hasBalcony, payload.rentalCost, payload.status || 'AVAILABLE', hostelId]
    );
    const insertedRoom = await query('SELECT TOP 1 * FROM Rooms WHERE roomNumber = ? AND block = ? AND floor = ? ORDER BY id DESC', [payload.roomNumber, payload.block, floor]);
    if (insertedRoom && insertedRoom.length > 0) {
      await ensureBedsForRoom(insertedRoom[0].id, toIntOrDefault(payload.capacity, 1));
      res.status(201).json({ ...insertedRoom[0] });
      return;
    }
    res.status(201).json({ ...payload, floor, hostelId, hasAC, hasAttachedBathroom, hasWifi, hasBalcony });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms/:id/apply', async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const payload = req.body || {};
    let studentId = toNullableInt(payload.studentId);

    if (!studentId && payload.studentEmail) {
      const student = await getStudentByEmail(payload.studentEmail);
      studentId = student?.id || null;
    }

    if (!studentId) {
      return res.status(400).json({ message: 'Student identity is required to apply for a room' });
    }

    const existingAllocation = await query('SELECT * FROM Allocations WHERE studentId = ? AND status = ?', [studentId, 'ACTIVE']);
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }

    const room = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const activeAllocationsForRoom = await query(
      'SELECT COUNT(*) AS count FROM Allocations WHERE roomId = ? AND status = ?',
      [roomId, 'ACTIVE']
    );
    const activeCount = Number(activeAllocationsForRoom?.[0]?.count || 0);
    if (activeCount >= Number(room[0].capacity || 0)) {
      await query('DELETE FROM RoomRequests WHERE roomId = ? AND status = ?', [roomId, 'PENDING']);
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    const existingRequest = await query(
      'SELECT * FROM RoomRequests WHERE studentId = ? AND roomId = ? AND status IN (?, ?)',
      [studentId, roomId, 'PENDING', 'APPROVED']
    );

    if (existingRequest && existingRequest.length > 0) {
      return res.status(400).json({ message: 'You have already requested this room' });
    }

    await query(
      'INSERT INTO RoomRequests (studentId, roomId, status, requestDate) VALUES (?, ?, ?, GETDATE())',
      [studentId, roomId, 'PENDING']
    );

    res.status(201).json({ message: 'Room request submitted successfully', studentId, roomId });
  } catch (err) {
    console.error('Apply room error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM Rooms WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    const room = result[0];
    const activeAllocations = await query('SELECT COUNT(*) AS count FROM Allocations WHERE roomId = ? AND status = ?', [id, 'ACTIVE']);
    const occupiedSeats = Number(activeAllocations?.[0]?.count || 0);
    const seatsLeft = Math.max(0, Number(room.capacity || 0) - occupiedSeats);
    const computedStatus = seatsLeft === 0 ? 'OCCUPIED' : 'AVAILABLE';

    if (room.status !== computedStatus) {
      await query('UPDATE Rooms SET status = ? WHERE id = ?', [computedStatus, id]);
    }

    res.json({
      ...room,
      status: computedStatus,
      occupiedSeats,
      seatsLeft,
    });
  } catch (err) {
    console.error('Get room detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const floor = toNullableInt(payload.floor);
    const hostelId = toIntOrDefault(payload.hostelId, 1);
    const hasAC = toBit(payload.hasAC, 0);
    const hasAttachedBathroom = toBit(payload.hasAttachedBathroom, 0);
    const hasWifi = toBit(payload.hasWifi, 0);
    const hasBalcony = toBit(payload.hasBalcony, 0);

    await query(
      `UPDATE Rooms 
       SET roomNumber = ?, block = ?, floor = ?, capacity = ?, type = ?, hasAC = ?, hasAttachedBathroom = ?, hasWifi = ?, hasBalcony = ?, rentalCost = ?, status = ?, hostelId = ?
       WHERE id = ?`,
      [
        payload.roomNumber,
        payload.block,
        floor,
        payload.capacity,
        payload.type,
        hasAC,
        hasAttachedBathroom,
        hasWifi,
        hasBalcony,
        payload.rentalCost,
        payload.status || 'AVAILABLE',
        hostelId,
        id
      ]
    );

    await ensureBedsForRoom(id, toIntOrDefault(payload.capacity, 1));

    res.json({ ...payload, id, floor, hostelId, hasAC, hasAttachedBathroom, hasWifi, hasBalcony });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const room = await getRoomById(id);
    const beds = await query('SELECT id FROM Beds WHERE roomId = ?', [id]);
    const bedIds = (beds || []).map((bed) => getRowId(bed)).filter((bedId) => bedId !== null);

    if (bedIds.length > 0) {
      const bedIdList = bedIds.join(',');
      await query(`DELETE FROM StayRecords WHERE bedId IN (${bedIdList})`);
      await query(`DELETE FROM Allocations WHERE bedId IN (${bedIdList})`);
    }

    await query('DELETE FROM RoomRequests WHERE roomId = ?', [id]);
    await query('DELETE FROM Maintenance WHERE roomId = ?', [id]);
    await query('DELETE FROM Beds WHERE roomId = ?', [id]);
    await query('DELETE FROM Rooms WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complaints (mapped to Maintenance table for compatibility with the current UI)
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.id, m.description, m.room, m.roomId, m.studentId, m.staffId, m.priority, m.status, m.reportedDate, m.assignedTo,
             m.assignedById, m.assignedDate, m.resolvedById, m.resolvedDate,
             m.studentApprovalStatus, m.studentApprovedById, m.studentApprovedDate,
             s.name AS studentName,
              s.email AS studentEmail,
             st.name AS staffName,
             ab.name AS assignedByName,
             rb.name AS resolvedByName,
             sap.name AS studentApprovedByName,
             r.roomNumber
      FROM Maintenance m
      LEFT JOIN Students s ON m.studentId = s.id
      LEFT JOIN Users st ON m.staffId = st.id OR m.assignedTo = st.id
      LEFT JOIN Users ab ON m.assignedById = ab.id
      LEFT JOIN Users rb ON m.resolvedById = rb.id
      LEFT JOIN Users sap ON m.studentApprovedById = sap.id
      LEFT JOIN Rooms r ON m.roomId = r.id
      ORDER BY m.reportedDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get complaint detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const payload = req.body;
    const reportedDate = new Date().toISOString();
    let roomId = toNullableInt(payload.roomId);
    let studentId = toNullableInt(payload.studentId);
    const staffId = toNullableInt(payload.staffId ?? payload.assignedTo);

    if (!studentId && payload.studentEmail) {
      const student = await getStudentByEmail(payload.studentEmail);
      studentId = student?.id || null;
    }

    let activeAllocation = null;
    if (!roomId && studentId) {
      activeAllocation = await getActiveAllocationForStudent(studentId);
      roomId = activeAllocation?.roomId || activeAllocation?.resolvedRoomId || null;
    }

    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || activeAllocation?.roomNumber || '';
    await query(
      'INSERT INTO Maintenance (description, room, roomId, studentId, staffId, priority, status, reportedDate, assignedTo, studentApprovalStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.description, roomName, roomId, studentId, staffId, payload.priority || 'MEDIUM', 'PENDING_ASSIGNMENT', reportedDate, staffId || null, 'PENDING']
    );
    const created = await query('SELECT TOP 1 * FROM Maintenance ORDER BY id DESC');
    res.status(201).json({ ...(created && created[0] ? created[0] : payload), room: roomName, roomId, studentId, staffId });
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const roomId = toNullableInt(payload.roomId);
    const studentId = toNullableInt(payload.studentId);
    const staffId = toNullableInt(payload.staffId ?? payload.assignedTo);
    const actorUserId = toNullableInt(payload.actorUserId);
    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || '';

    if (payload.action === 'ASSIGN') {
      await query(
        `UPDATE Maintenance
         SET room = ?, roomId = ?, staffId = ?, assignedTo = ?, assignedById = ?, assignedDate = GETDATE(),
             status = ?, studentApprovalStatus = ?
         WHERE id = ?`,
        [roomName, roomId, staffId, staffId, actorUserId, 'ASSIGNED', 'PENDING', id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'ASSIGN' });
    }

    if (payload.action === 'RESOLVE') {
      await query(
        `UPDATE Maintenance
         SET status = ?, resolvedById = ?, resolvedDate = GETDATE()
         WHERE id = ?`,
        ['RESOLVED_PENDING_APPROVAL', actorUserId || staffId, id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'RESOLVE' });
    }

    if (payload.action === 'STUDENT_APPROVE') {
      const approvalDecision = String(payload.decision || 'APPROVED').toUpperCase();
      if (approvalDecision === 'REJECTED') {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(), status = ?
           WHERE id = ?`,
          ['REJECTED', actorUserId, 'ASSIGNED', id]
        );
      } else {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(), status = ?
           WHERE id = ?`,
          ['APPROVED', actorUserId, 'CLOSED', id]
        );
      }

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'STUDENT_APPROVE', decision: approvalDecision });
    }

    await query(
      'UPDATE Maintenance SET description = ?, room = ?, roomId = ?, studentId = ?, staffId = ?, priority = ?, status = ?, assignedTo = ? WHERE id = ?',
      [payload.description, roomName, roomId, studentId, staffId, payload.priority || 'MEDIUM', payload.status || 'PENDING_ASSIGNMENT', staffId || null, id]
    );

    res.json({ ...payload, id, room: roomName, roomId, studentId, staffId });
  } catch (err) {
    console.error('Update complaint error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM Maintenance WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete complaint error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Maintenance (module routes expected by frontend)
app.get('/api/maintenance', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.id, m.description, m.room, m.roomId, m.studentId, m.staffId, m.priority, m.status, m.reportedDate, m.assignedTo,
             m.assignedById, m.assignedDate, m.resolvedById, m.resolvedDate,
             m.studentApprovalStatus, m.studentApprovedById, m.studentApprovedDate,
             s.name AS studentName,
              s.email AS studentEmail,
             st.name AS staffName,
             ab.name AS assignedByName,
             rb.name AS resolvedByName,
             sap.name AS studentApprovedByName,
             r.roomNumber
      FROM Maintenance m
      LEFT JOIN Students s ON m.studentId = s.id
      LEFT JOIN Users st ON m.staffId = st.id OR m.assignedTo = st.id
      LEFT JOIN Users ab ON m.assignedById = ab.id
      LEFT JOIN Users rb ON m.resolvedById = rb.id
      LEFT JOIN Users sap ON m.studentApprovedById = sap.id
      LEFT JOIN Rooms r ON m.roomId = r.id
      ORDER BY m.reportedDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get maintenance error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/maintenance/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get maintenance detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const payload = req.body;
    const reportedDate = new Date().toISOString();
    let roomId = toNullableInt(payload.roomId);
    let studentId = toNullableInt(payload.studentId);
    const staffId = toNullableInt(payload.staffId ?? payload.assignedTo);

    if (!studentId && payload.studentEmail) {
      const student = await getStudentByEmail(payload.studentEmail);
      studentId = student?.id || null;
    }

    let activeAllocation = null;
    if (!roomId && studentId) {
      activeAllocation = await getActiveAllocationForStudent(studentId);
      roomId = activeAllocation?.roomId || activeAllocation?.resolvedRoomId || null;
    }

    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || activeAllocation?.roomNumber || '';
    await query(
      'INSERT INTO Maintenance (description, room, roomId, studentId, staffId, priority, status, reportedDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.description, roomName, roomId, studentId, staffId, payload.priority || 'MEDIUM', payload.status || 'PENDING_ASSIGNMENT', reportedDate, staffId || null]
    );
    const created = await query('SELECT TOP 1 * FROM Maintenance ORDER BY id DESC');
    res.status(201).json({ ...(created && created[0] ? created[0] : payload), room: roomName, roomId, studentId, staffId });
  } catch (err) {
    console.error('Create maintenance error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const roomId = toNullableInt(payload.roomId);
    const studentId = toNullableInt(payload.studentId);
    const staffId = toNullableInt(payload.staffId ?? payload.assignedTo);
    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || '';
    await query(
      'UPDATE Maintenance SET description = ?, room = ?, roomId = ?, studentId = ?, staffId = ?, priority = ?, status = ?, assignedTo = ? WHERE id = ?',
      [payload.description, roomName, roomId, studentId, staffId, payload.priority || 'MEDIUM', payload.status || 'PENDING', staffId || null, id]
    );
    res.json({ ...payload, id, room: roomName, roomId, studentId, staffId });
  } catch (err) {
    console.error('Update maintenance error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM Maintenance WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete maintenance error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Payments');
    res.json(result);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const payload = req.body;
    const paymentDate = new Date().toISOString();
    await query(
      'INSERT INTO Payments (invoiceId, studentId, amount, paymentDate, method, reference) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.invoiceId || null, payload.studentId, payload.amount, paymentDate, payload.method || 'CASH', payload.reference || '']
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fees module routes expected by frontend
app.get('/api/fees/invoices', async (req, res) => {
  try {
    const result = await query(`
      SELECT i.*,
             CASE
               WHEN i.status = 'PAID' THEN 'PAID'
               WHEN i.dueDate < GETDATE() THEN 'OVERDUE'
               ELSE i.status
             END AS effectiveStatus,
             s.name AS studentName,
             s.registrationNumber
      FROM Invoices i
      LEFT JOIN Students s ON i.studentId = s.id
      ORDER BY i.dueDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/fees/invoices/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM Invoices WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get invoice detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/fees/invoices', async (req, res) => {
  try {
    const payload = req.body;
    const dueDate = payload.dueDate || new Date().toISOString();
    await query(
      'INSERT INTO Invoices (studentId, amount, dueDate, status, description) VALUES (?, ?, ?, ?, ?)',
      [payload.studentId, payload.amount, dueDate, payload.status || 'PENDING', payload.description || '']
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/fees/invoices/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    await query(
      'UPDATE Invoices SET studentId = ?, amount = ?, dueDate = ?, status = ?, description = ? WHERE id = ?',
      [payload.studentId, payload.amount, payload.dueDate, payload.status || 'PENDING', payload.description || '', id]
    );
    res.json({ ...payload, id });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/fees/payments', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.name AS studentName, s.registrationNumber
      FROM Payments p
      LEFT JOIN Students s ON p.studentId = s.id
      ORDER BY p.paymentDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get fee payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/fees/rent-status', async (req, res) => {
  try {
    const studentIdParam = toNullableInt(req.query.studentId);
    const studentEmail = req.query.studentEmail;

    let student = null;
    if (studentIdParam) {
      const byId = await query('SELECT TOP 1 * FROM Students WHERE id = ?', [studentIdParam]);
      student = byId && byId.length > 0 ? byId[0] : null;
    } else if (studentEmail) {
      student = await getStudentByEmail(studentEmail);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allocation = await getActiveAllocationForStudent(student.id);
    if (!allocation) {
      return res.json({
        studentId: student.id,
        hasActiveAllocation: false,
        notifyRent: false,
        canPayNow: false,
        daysUsed: 0,
        pendingCycles: 0,
      });
    }

    const daysRow = await query('SELECT DATEDIFF(day, ?, GETDATE()) AS daysUsed', [allocation.checkInDate]);
    const daysUsed = Math.max(0, Number(daysRow?.[0]?.daysUsed || 0));
    const dueCycles = Math.floor(daysUsed / 31);

    const paidCyclesRow = await query(
      "SELECT COUNT(*) AS count FROM Payments WHERE studentId = ? AND reference LIKE 'RENT_%_CYCLE_%'",
      [student.id]
    );
    const paidCycles = Number(paidCyclesRow?.[0]?.count || 0);
    const pendingCycles = Math.max(0, dueCycles - paidCycles);
    const nextCycleToPay = paidCycles + 1;
    const nextPayDayThreshold = nextCycleToPay * 31;

    // Calculate consecutive payment months based on rent cycle references
    const rentCycleRows = await query(
      "SELECT reference FROM Payments WHERE studentId = ? AND reference LIKE 'RENT_%_CYCLE_%' ORDER BY paymentDate DESC",
      [student.id]
    );

    let consecutiveMonths = 0;
    if (rentCycleRows && rentCycleRows.length > 0) {
      const cycles = rentCycleRows
        .map((row) => {
          const match = row.reference.match(/CYCLE_(\d+)/);
          return match ? Number(match[1]) : null;
        })
        .filter((cycle) => Number.isFinite(cycle))
        .sort((a, b) => b - a);

      let expectedCycle = cycles[0];
      for (const cycle of cycles) {
        if (cycle === expectedCycle) {
          consecutiveMonths += 1;
          expectedCycle -= 1;
        } else {
          break;
        }
      }
    }

    return res.json({
      studentId: student.id,
      studentName: student.name,
      hasActiveAllocation: true,
      roomId: allocation.roomId,
      roomNumber: allocation.roomNumber,
      monthlyRent: Number(allocation.rentalCost || 0),
      daysUsed,
      notifyRent: daysUsed >= 25,
      canPayNow: daysUsed >= nextPayDayThreshold,
      daysUntilPaymentDue: Math.max(0, nextPayDayThreshold - daysUsed),
      pendingCycles,
      paidCycles,
      monthsPaid: paidCycles,
      consecutiveMonths,
      nextCycleToPay,
      status: pendingCycles > 0 ? 'DUE' : 'OK',
    });
  } catch (err) {
    console.error('Get rent status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/fees/rent-pay', async (req, res) => {
  try {
    const payload = req.body || {};
    const studentIdParam = toNullableInt(payload.studentId);
    const studentEmail = payload.studentEmail;

    let student = null;
    if (studentIdParam) {
      const byId = await query('SELECT TOP 1 * FROM Students WHERE id = ?', [studentIdParam]);
      student = byId && byId.length > 0 ? byId[0] : null;
    } else if (studentEmail) {
      student = await getStudentByEmail(studentEmail);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allocation = await getActiveAllocationForStudent(student.id);
    if (!allocation) {
      return res.status(400).json({ message: 'No active allocation found for student' });
    }

    const daysRow = await query('SELECT DATEDIFF(day, ?, GETDATE()) AS daysUsed', [allocation.checkInDate]);
    const daysUsed = Math.max(0, Number(daysRow?.[0]?.daysUsed || 0));
    const dueCycles = Math.floor(daysUsed / 31);

    const paidCyclesRow = await query(
      "SELECT COUNT(*) AS count FROM Payments WHERE studentId = ? AND reference LIKE 'RENT_%_CYCLE_%'",
      [student.id]
    );
    const paidCycles = Number(paidCyclesRow?.[0]?.count || 0);
    const nextCycleToPay = paidCycles + 1;
    const nextPayDayThreshold = nextCycleToPay * 31;

    if (daysUsed < nextPayDayThreshold || dueCycles <= paidCycles) {
      return res.status(400).json({
        message: 'Rent payment window is not open yet or no due cycle is pending',
        daysUsed,
        nextPayDayThreshold,
      });
    }

    const amount = Number(allocation.rentalCost || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid room rental cost for billing' });
    }

    const cycleLabel = `RENT_${student.id}_CYCLE_${nextCycleToPay}`;
    const invoiceDescription = `RENT_CYCLE_${nextCycleToPay}`;
    const method = payload.method || 'CARD';
    const externalReference = payload.reference || null;

    const txResult = await query(
      `BEGIN TRY
         BEGIN TRAN;

         IF EXISTS (SELECT 1 FROM Payments WHERE studentId = ? AND reference = ?)
         BEGIN
           RAISERROR('This rent cycle is already paid.', 16, 1);
         END

         DECLARE @invoiceId INT;

         SELECT TOP 1 @invoiceId = id
         FROM Invoices
         WHERE studentId = ?
           AND description = ?
         ORDER BY id DESC;

         IF @invoiceId IS NULL
         BEGIN
           INSERT INTO Invoices (studentId, amount, dueDate, status, description)
           VALUES (?, ?, GETDATE(), 'PENDING', ?);
           SET @invoiceId = SCOPE_IDENTITY();
         END

         INSERT INTO Payments (invoiceId, studentId, amount, paymentDate, method, reference)
         VALUES (@invoiceId, ?, ?, GETDATE(), ?, ?);

         UPDATE Invoices
         SET status = 'PAID'
         WHERE id = @invoiceId;

         COMMIT TRAN;

         SELECT @invoiceId AS invoiceId;
       END TRY
       BEGIN CATCH
         IF @@TRANCOUNT > 0
           ROLLBACK TRAN;

         DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
         RAISERROR(@Err, 16, 1);
       END CATCH`,
      [
        student.id,
        cycleLabel,
        student.id,
        invoiceDescription,
        student.id,
        amount,
        invoiceDescription,
        student.id,
        amount,
        method,
        cycleLabel,
      ]
    );

    res.status(201).json({
      message: 'Rent payment successful',
      studentId: student.id,
      cycle: nextCycleToPay,
      amount,
      invoiceId: txResult?.[0]?.invoiceId || null,
      externalReference,
    });
  } catch (err) {
    console.error('Rent payment error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.get('/api/fees/payments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT * FROM Payments WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get fee payment detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/fees/payments', async (req, res) => {
  try {
    const payload = req.body;
    const paymentDate = new Date().toISOString();
    await query(
      'INSERT INTO Payments (invoiceId, studentId, amount, paymentDate, method, reference) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.invoiceId || null, payload.studentId, payload.amount, paymentDate, payload.method || 'CASH', payload.reference || '']
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create fee payment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/fees/payments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    await query(
      'UPDATE Payments SET invoiceId = ?, studentId = ?, amount = ?, method = ?, reference = ? WHERE id = ?',
      [payload.invoiceId || null, payload.studentId, payload.amount, payload.method || 'CASH', payload.reference || '', id]
    );
    res.json({ ...payload, id });
  } catch (err) {
    console.error('Update fee payment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff module routes expected by frontend
app.get('/api/staff', async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, role, hostelId FROM Users WHERE role IN ('WARDEN', 'CARETAKER')");
    res.json(result);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT id, name, email, role, hostelId FROM Users WHERE id = ?', [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get staff member error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const payload = req.body;
    const role = payload.role === 'CARETAKER' ? 'CARETAKER' : 'WARDEN';
    const hostelId = toIntOrDefault(payload.hostelId, 1);

    if (!payload.name || !payload.email || !payload.password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (String(payload.password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existing = await query('SELECT id FROM Users WHERE email = ?', [payload.email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hostel = await query('SELECT TOP 1 id FROM Hostels WHERE id = ?', [hostelId]);
    if (!hostel || hostel.length === 0) {
      return res.status(400).json({ message: 'Invalid hostel id' });
    }

    await query(
      'INSERT INTO Users (name, email, password, role, hostelId) VALUES (?, ?, ?, ?, ?)',
      [payload.name, payload.email, payload.password || 'password', role, hostelId]
    );
    res.status(201).json({ name: payload.name, email: payload.email, role, hostelId });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const role = payload.role === 'CARETAKER' ? 'CARETAKER' : 'WARDEN';
    const hostelId = toIntOrDefault(payload.hostelId, 1);

    const hostel = await query('SELECT TOP 1 id FROM Hostels WHERE id = ?', [hostelId]);
    if (!hostel || hostel.length === 0) {
      return res.status(400).json({ message: 'Invalid hostel id' });
    }

    await query(
      'UPDATE Users SET name = ?, email = ?, role = ?, hostelId = ? WHERE id = ?',
      [payload.name, payload.email, role, hostelId, id]
    );
    res.json({ ...payload, id, role, hostelId });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM Users WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await query("SELECT * FROM Users WHERE role != 'ADMIN'");
    res.json(result);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
/* =========================
   STUDENT APPLY FOR ROOM
========================= */

app.post('/api/room-requests', async (req, res) => {
  try {
    const { studentId, studentEmail, roomId } = req.body;
    let resolvedStudentId = toNullableInt(studentId);

    if (!resolvedStudentId && studentEmail) {
      const student = await getStudentByEmail(studentEmail);
      resolvedStudentId = student?.id || null;
    }

    if (!resolvedStudentId || !roomId) {
      return res.status(400).json({ message: 'Student ID and Room ID are required' });
    }

    const room = await query('SELECT TOP 1 * FROM Rooms WHERE id = ?', [roomId]);
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const activeAllocationsForRoom = await query(
      'SELECT COUNT(*) AS count FROM Allocations WHERE roomId = ? AND status = ?',
      [roomId, 'ACTIVE']
    );
    const activeCount = Number(activeAllocationsForRoom?.[0]?.count || 0);
    if (activeCount >= Number(room[0].capacity || 0)) {
      await query('DELETE FROM RoomRequests WHERE roomId = ? AND status = ?', [roomId, 'PENDING']);
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    const existingAllocation = await query('SELECT * FROM Allocations WHERE studentId = ? AND status = ?', [resolvedStudentId, 'ACTIVE']);
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }

    // Check if student already has a pending or approved request for this room
    const existingRequest = await query(
      'SELECT * FROM RoomRequests WHERE studentId = ? AND roomId = ? AND status IN (?, ?)',
      [resolvedStudentId, roomId, 'PENDING', 'APPROVED']
    );

    if (existingRequest && existingRequest.length > 0) {
      return res.status(400).json({ message: 'You have already requested this room' });
    }

    // Create the request
    await query(
      'INSERT INTO RoomRequests (studentId, roomId, status, requestDate) VALUES (?, ?, ?, GETDATE())',
      [resolvedStudentId, roomId, 'PENDING']
    );

    res.status(201).json({ message: 'Room request submitted successfully', studentId: resolvedStudentId, roomId });
  } catch (err) {
    console.error('Create room request error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

/* =========================
   ADMIN VIEW REQUESTS
========================= */

app.get('/api/room-requests', async (req, res) => {
  try {
    const { studentEmail } = req.query;
    const params = [];
    let whereClause = '';

    if (studentEmail) {
      whereClause = 'WHERE s.email = ?';
      params.push(studentEmail);
    }

    const result = await query(`
            SELECT rr.id, rr.studentId, rr.roomId, rr.status,
             s.name AS studentName,
             s.email AS studentEmail,
             r.roomNumber
      FROM RoomRequests rr
      JOIN Students s ON rr.studentId = s.id
      JOIN Rooms r ON rr.roomId = r.id
      ${whereClause}
            ORDER BY rr.id DESC
    `, params);

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* =========================
   ADMIN APPROVE REQUEST
========================= */

app.put('/api/room-requests/:id/approve', async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const request = await query(
      'SELECT TOP 1 rr.id, rr.studentId, rr.roomId, rr.status, s.email AS studentEmail, r.capacity FROM RoomRequests rr JOIN Students s ON rr.studentId = s.id JOIN Rooms r ON rr.roomId = r.id WHERE rr.id = ?',
      [requestId]
    );

    if (!request || request.length === 0) {
      return res.status(404).json({ message: 'Room request not found' });
    }

    const currentRequest = request[0];
    if (currentRequest.status === 'APPROVED') {
      return res.json({ message: 'Approved successfully' });
    }
    if (currentRequest.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    const existingAllocation = await query(
      'SELECT * FROM Allocations WHERE studentId = ? AND status = ?',
      [currentRequest.studentId, 'ACTIVE']
    );
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }

    await query('BEGIN TRANSACTION');
    try {
      const room = await query('SELECT TOP 1 * FROM Rooms WHERE id = ?', [currentRequest.roomId]);
      if (!room || room.length === 0) {
        throw new Error('Room not found');
      }

      const activeAllocationsForRoom = await query(
        'SELECT COUNT(*) AS count FROM Allocations WHERE roomId = ? AND status = ?',
        [currentRequest.roomId, 'ACTIVE']
      );
      const activeCount = Number(activeAllocationsForRoom?.[0]?.count || 0);
      if (activeCount >= Number(room[0].capacity || 0)) {
        throw new Error('Room is at full capacity');
      }

      await ensureBedsForRoom(currentRequest.roomId, room[0].capacity);
      const bed = await getAvailableBed(currentRequest.roomId, Number(room[0].capacity || 0));
      const bedId = getRowId(bed);
      if (!bedId) {
        throw new Error('Room is at full capacity');
      }

      await query(
        'INSERT INTO Allocations (studentId, roomId, bedId, checkInDate, status) VALUES (?, ?, ?, GETDATE(), ?)',
        [currentRequest.studentId, currentRequest.roomId, bedId, 'ACTIVE']
      );
      await query(
        'INSERT INTO StayRecords (studentId, bedId, checkInDate, status) VALUES (?, ?, GETDATE(), ?)',
        [currentRequest.studentId, bedId, 'ACTIVE']
      );
      await query('UPDATE Beds SET status = ? WHERE id = ?', ['OCCUPIED', bedId]);

      const activeBeds = await query('SELECT COUNT(*) AS count FROM Beds WHERE roomId = ? AND status = ?', [currentRequest.roomId, 'OCCUPIED']);
      const newStatus = Number(activeBeds?.[0]?.count || 0) >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
      await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, currentRequest.roomId]);

      if (newStatus === 'OCCUPIED') {
        await query('DELETE FROM RoomRequests WHERE roomId = ? AND status = ?', [currentRequest.roomId, 'PENDING']);
      }

      await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['APPROVED', requestId]);
      await query('DELETE FROM RoomRequests WHERE studentId = ? AND id <> ?', [currentRequest.studentId, requestId]);
      await query('COMMIT TRANSACTION');

      res.json({ message: 'Approved successfully', bedId });
    } catch (approveError) {
      await query('ROLLBACK TRANSACTION');
      throw approveError;
    }
  } catch (err) {
    console.error('Approve room request error:', err);
    const message = err.message || 'Internal server error';
    if (message === 'Room is at full capacity') {
      return res.status(400).json({ message });
    }
    res.status(500).json({ message });
  }
})

app.get('/api/reports/occupancy', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        r.id,
        r.id AS roomId,
        r.roomNumber,
        r.capacity,
        COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END) AS occupied,
        (r.capacity - COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END)) AS available,
        GETDATE() AS reportDate
      FROM Rooms r
      LEFT JOIN Beds b ON b.roomId = r.id
      GROUP BY r.id, r.roomNumber, r.capacity
      ORDER BY r.roomNumber
    `);
    res.json(result);
  } catch (err) {
    console.error('Get occupancy report error:', err);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

app.get('/api/reports/dues', async (req, res) => {
  try {
    const result = await query(`
      WITH ActiveAllocations AS (
        SELECT a.studentId, a.roomId, a.checkInDate,
               ROW_NUMBER() OVER (PARTITION BY a.studentId ORDER BY a.checkInDate DESC, a.id DESC) AS rn
        FROM Allocations a
        WHERE a.status = 'ACTIVE'
      ),
      PaidCycles AS (
        SELECT p.studentId, COUNT(*) AS paidCycles
        FROM Payments p
        WHERE p.reference LIKE 'RENT_%_CYCLE_%'
        GROUP BY p.studentId
      )
      SELECT
        s.id AS studentId,
        s.name AS studentName,
        s.registrationNumber,
        s.email AS studentEmail,
        r.roomNumber,
        r.rentalCost AS monthlyRent,
        DATEDIFF(day, aa.checkInDate, GETDATE()) AS daysUsed,
        ISNULL(pc.paidCycles, 0) AS paidCycles,
        FLOOR(DATEDIFF(day, aa.checkInDate, GETDATE()) / 31.0) AS dueCycles,
        CASE
          WHEN FLOOR(DATEDIFF(day, aa.checkInDate, GETDATE()) / 31.0) - ISNULL(pc.paidCycles, 0) > 0 THEN 'DUE'
          ELSE 'OK'
        END AS status,
        GETDATE() AS reportDate
      FROM ActiveAllocations aa
      JOIN Students s ON aa.studentId = s.id
      JOIN Rooms r ON aa.roomId = r.id
      LEFT JOIN PaidCycles pc ON pc.studentId = s.id
      WHERE aa.rn = 1
      ORDER BY status DESC, s.name ASC
    `);

    res.json(result);
  } catch (err) {
    console.error('Get dues report error:', err);
    res.status(500).json({ message: 'Error fetching dues report' });
  }
});

app.get('/api/reports/maintenance', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        m.id,
        m.status,
        m.priority,
        m.reportedDate,
        m.assignedDate,
        m.resolvedDate,
        m.studentApprovalStatus,
        r.roomNumber,
        s.name AS studentName,
        u.name AS staffName,
        m.description
      FROM Maintenance m
      LEFT JOIN Rooms r ON m.roomId = r.id
      LEFT JOIN Students s ON m.studentId = s.id
      LEFT JOIN Users u ON m.staffId = u.id
      ORDER BY m.reportedDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get maintenance report error:', err);
    res.status(500).json({ message: 'Error fetching maintenance report' });
  }
});



// Allocations CRUD
app.get('/api/allocations', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.studentId, a.roomId, a.bedId, a.checkInDate, a.status,
             s.name as studentName, s.registrationNumber, s.email as studentEmail,
             r.roomNumber, r.block, r.floor, r.type,
             b.bedNumber
      FROM Allocations a
      JOIN Students s ON a.studentId = s.id
      JOIN Rooms r ON a.roomId = r.id
      LEFT JOIN Beds b ON a.bedId = b.id
      ORDER BY a.checkInDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get allocations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/allocations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query(`
      SELECT a.id, a.studentId, a.roomId, a.bedId, a.checkInDate, a.checkOutDate, a.status,
             s.name as studentName, s.registrationNumber, s.email as studentEmail,
             r.roomNumber, r.block, r.floor, r.type,
             b.bedNumber
      FROM Allocations a
      JOIN Students s ON a.studentId = s.id
      JOIN Rooms r ON a.roomId = r.id
      LEFT JOIN Beds b ON a.bedId = b.id
      WHERE a.id = ?
    `, [id]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Get allocation detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/allocations', async (req, res) => {
  try {
    const { studentId, roomId, allocated_date, status = 'ACTIVE', studentData } = req.body;
    let resolvedStudentId = toNullableInt(studentId);

    if (!resolvedStudentId && studentData) {
      const studentEmail = studentData.email;
      if (!studentData.name || !studentEmail || !studentData.password) {
        return res.status(400).json({ message: 'Student name, email and password are required for inline registration' });
      }

      const existingStudent = await getStudentByEmail(studentEmail);
      if (existingStudent) {
        resolvedStudentId = existingStudent.id;
      } else {
        const existingUserRows = await query('SELECT TOP 1 * FROM Users WHERE email = ?', [studentEmail]);
        if (existingUserRows && existingUserRows.length > 0 && existingUserRows[0].role !== 'STUDENT') {
          return res.status(400).json({ message: 'Email already belongs to a non-student account' });
        }

        await query('BEGIN TRANSACTION');
        try {
          if (!existingUserRows || existingUserRows.length === 0) {
            await query(
              'INSERT INTO Users (name, email, password, role, hostelId) VALUES (?, ?, ?, ?, ?)',
              [studentData.name, studentEmail, studentData.password, 'STUDENT', null]
            );
          }

          await query(
            'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              studentData.name,
              studentEmail,
              studentData.phone || '',
              studentData.registrationNumber || '',
              studentData.department || '',
              toIntOrDefault(studentData.yearOfStudy, 1),
              'ACTIVE',
              studentData.password,
            ]
          );

          const insertedStudent = await query('SELECT TOP 1 * FROM Students WHERE email = ? ORDER BY id DESC', [studentEmail]);
          resolvedStudentId = insertedStudent?.[0]?.id || null;

          await query('COMMIT TRANSACTION');
        } catch (registerErr) {
          await query('ROLLBACK TRANSACTION');
          throw registerErr;
        }
      }
    }

    if (!resolvedStudentId || !roomId) {
      return res.status(400).json({ message: 'Student and room are required' });
    }
    
    // Check if student already has an active allocation
    const existingAllocation = await query('SELECT * FROM Allocations WHERE studentId = ? AND status = ?', [resolvedStudentId, 'ACTIVE']);
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }
    
    const room = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
    
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const activeAllocationsForRoom = await query(
      'SELECT COUNT(*) AS count FROM Allocations WHERE roomId = ? AND status = ?',
      [roomId, 'ACTIVE']
    );
    const activeCount = Number(activeAllocationsForRoom?.[0]?.count || 0);
    if (activeCount >= Number(room[0].capacity || 0)) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    await ensureBedsForRoom(roomId, room[0].capacity);
    const bed = await getAvailableBed(roomId, Number(room[0].capacity || 0));
    const bedId = getRowId(bed);
    if (!bedId) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }
    
    // Create allocation
    const checkIn = allocated_date || new Date().toISOString();
    await query('INSERT INTO Allocations (studentId, roomId, bedId, checkInDate, status) VALUES (?, ?, ?, ?, ?)', [resolvedStudentId, roomId, bedId, checkIn, status]);
    await query('INSERT INTO StayRecords (studentId, bedId, checkInDate, status) VALUES (?, ?, ?, ?)', [resolvedStudentId, bedId, checkIn, status]);
    await query('UPDATE Beds SET status = ? WHERE id = ?', [status === 'ACTIVE' ? 'OCCUPIED' : 'AVAILABLE', bedId]);
    
    // Update room status if now full
    const activeBeds = await query('SELECT COUNT(*) AS count FROM Beds WHERE roomId = ? AND status = ?', [roomId, 'OCCUPIED']);
    const newStatus = Number(activeBeds?.[0]?.count || 0) >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
    await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);

    if (newStatus === 'OCCUPIED') {
      await query('DELETE FROM RoomRequests WHERE roomId = ? AND status = ?', [roomId, 'PENDING']);
    }
    
    const createdAllocation = await query(
      `SELECT TOP 1 a.id, a.studentId, a.roomId, a.bedId, a.checkInDate, a.checkOutDate, a.status,
              b.bedNumber
       FROM Allocations a
       LEFT JOIN Beds b ON a.bedId = b.id
       WHERE a.studentId = ? AND a.roomId = ? AND a.bedId = ?
       ORDER BY a.id DESC`,
      [resolvedStudentId, roomId, bedId]
    );
    res.status(201).json({
      ...(createdAllocation && createdAllocation[0] ? createdAllocation[0] : {}),
      message: 'Allocation created successfully',
      bedId,
    });
  } catch (err) {
    console.error('Create allocation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/allocations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { studentId, roomId, checkInDate, checkOutDate, status = 'ACTIVE' } = req.body;

    const existing = await query('SELECT * FROM Allocations WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    await query(
      'UPDATE Allocations SET studentId = ?, roomId = ?, checkInDate = ?, checkOutDate = ?, status = ? WHERE id = ?',
      [
        studentId ?? existing[0].studentId,
        roomId ?? existing[0].roomId,
        checkInDate ?? existing[0].checkInDate,
        checkOutDate ?? existing[0].checkOutDate ?? null,
        status,
        id,
      ]
    );

    const currentBed = existing[0].bedId ?? null;
    res.json({ id, studentId: studentId ?? existing[0].studentId, roomId: roomId ?? existing[0].roomId, checkInDate, checkOutDate, status, bedId: currentBed });
  } catch (err) {
    console.error('Update allocation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/allocations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Get allocation details
    const allocation = await query('SELECT * FROM Allocations WHERE id = ?', [id]);
    if (!allocation || allocation.length === 0) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    
    const { roomId, studentId, bedId } = allocation[0];
    
    if (bedId) {
      await closeActiveStayRecord(studentId, bedId);
      await query('UPDATE Beds SET status = ? WHERE id = ?', ['AVAILABLE', bedId]);
    }

    // Delete allocation
    await query('DELETE FROM Allocations WHERE id = ?', [id]);
    
    // Update room status
    await syncRoomStatus(roomId);
    
    res.status(204).send();
  } catch (err) {
    console.error('Delete allocation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Analytics Endpoints
app.get('/api/analytics/occupancy', async (req, res) => {
  try {
    // Room occupancy by status
    const occupancyQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Rooms), 1) as percentage
      FROM Rooms 
      GROUP BY status
    `;
    const occupancyResult = await query(occupancyQuery);

    // Room type distribution
    const roomTypeQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Rooms), 1) as percentage
      FROM Rooms 
      WHERE type IS NOT NULL
      GROUP BY type
    `;
    const roomTypeResult = await query(roomTypeQuery);

    // Floor-wise occupancy
    const floorQuery = `
      SELECT 
        floor,
        COUNT(*) as total_rooms,
        SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_rooms,
        ROUND((SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 1) as occupancy_rate
      FROM Rooms 
      GROUP BY floor
      ORDER BY floor
    `;
    const floorResult = await query(floorQuery);

    res.json({
      occupancyByStatus: occupancyResult,
      roomTypeDistribution: roomTypeResult,
      floorOccupancy: floorResult,
      totalRooms: occupancyResult.reduce((sum, item) => sum + item.count, 0),
      occupiedRooms: occupancyResult.find(item => item.status === 'OCCUPIED')?.count || 0
    });
  } catch (err) {
    console.error('Occupancy analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/analytics/financial', async (req, res) => {
  try {
    // Monthly revenue (last 12 months)
    const revenueQuery = `
      SELECT 
        YEAR(paymentDate) as year,
        MONTH(paymentDate) as month,
        SUM(amount) as total_revenue,
        COUNT(*) as payment_count
      FROM Payments 
      WHERE paymentDate >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY YEAR(paymentDate), MONTH(paymentDate)
      ORDER BY year DESC, month DESC
    `;
    const revenueResult = await query(revenueQuery);

    // Outstanding dues by student
    const duesQuery = `
      SELECT 
        s.name,
        s.email,
        a.roomId,
        COUNT(*) as pending_cycles,
        SUM(CASE WHEN f.status = 'PENDING' THEN f.amount ELSE 0 END) as total_dues
      FROM Fees f
      JOIN Students s ON f.studentId = s.id
      LEFT JOIN Allocations a ON s.id = a.studentId AND a.status = 'ACTIVE'
      WHERE f.status = 'PENDING'
      GROUP BY s.id, s.name, s.email, a.roomId
      HAVING SUM(CASE WHEN f.status = 'PENDING' THEN f.amount ELSE 0 END) > 0
      ORDER BY total_dues DESC
    `;
    const duesResult = await query(duesQuery);

    // Payment method distribution
    const paymentMethodQuery = `
      SELECT 
        paymentMethod,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Payments), 1) as percentage
      FROM Payments 
      GROUP BY paymentMethod
    `;
    const paymentMethodResult = await query(paymentMethodQuery);

    // Revenue by room type
    const revenueByRoomQuery = `
      SELECT 
        r.type,
        COUNT(DISTINCT p.id) as payment_count,
        SUM(p.amount) as total_revenue
      FROM Payments p
      JOIN Students s ON p.studentId = s.id
      LEFT JOIN Allocations a ON s.id = a.studentId AND a.status = 'ACTIVE'
      LEFT JOIN Rooms r ON a.roomId = r.id
      GROUP BY r.type
    `;
    const revenueByRoomResult = await query(revenueByRoomQuery);

    res.json({
      monthlyRevenue: revenueResult,
      outstandingDues: duesResult,
      paymentMethods: paymentMethodResult,
      revenueByRoomType: revenueByRoomResult,
      totalRevenue: revenueResult.reduce((sum, item) => sum + item.total_revenue, 0),
      totalOutstanding: duesResult.reduce((sum, item) => sum + item.total_dues, 0)
    });
  } catch (err) {
    console.error('Financial analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/analytics/students', async (req, res) => {
  try {
    // Course-wise distribution
    const courseQuery = `
      SELECT 
        course,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students 
      WHERE course IS NOT NULL
      GROUP BY course
      ORDER BY count DESC
    `;
    const courseResult = await query(courseQuery);

    // Age distribution
    const ageQuery = `
      SELECT 
        CASE 
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) < 18 THEN 'Under 18'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 18 AND 20 THEN '18-20'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 21 AND 23 THEN '21-23'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 24 AND 26 THEN '24-26'
          ELSE '27+'
        END as age_group,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students WHERE dateOfBirth IS NOT NULL), 1) as percentage
      FROM Students 
      WHERE dateOfBirth IS NOT NULL
      GROUP BY 
        CASE 
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) < 18 THEN 'Under 18'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 18 AND 20 THEN '18-20'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 21 AND 23 THEN '21-23'
          WHEN DATEDIFF(YEAR, dateOfBirth, GETDATE()) BETWEEN 24 AND 26 THEN '24-26'
          ELSE '27+'
        END
      ORDER BY 
        CASE age_group
          WHEN 'Under 18' THEN 1
          WHEN '18-20' THEN 2
          WHEN '21-23' THEN 3
          WHEN '24-26' THEN 4
          ELSE 5
        END
    `;
    const ageResult = await query(ageQuery);

    // Gender distribution
    const genderQuery = `
      SELECT 
        gender,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students 
      WHERE gender IS NOT NULL
      GROUP BY gender
    `;
    const genderResult = await query(genderQuery);

    // Nationality distribution
    const nationalityQuery = `
      SELECT 
        nationality,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students 
      WHERE nationality IS NOT NULL
      GROUP BY nationality
      ORDER BY count DESC
    `;
    const nationalityResult = await query(nationalityQuery);

    // Year of study distribution
    const yearQuery = `
      SELECT 
        yearOfStudy,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students 
      WHERE yearOfStudy IS NOT NULL
      GROUP BY yearOfStudy
      ORDER BY yearOfStudy
    `;
    const yearResult = await query(yearQuery);

    res.json({
      courseDistribution: courseResult,
      ageDistribution: ageResult,
      genderDistribution: genderResult,
      nationalityDistribution: nationalityResult,
      yearOfStudyDistribution: yearResult,
      totalStudents: courseResult.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (err) {
    console.error('Student analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/analytics/maintenance', async (req, res) => {
  try {
    // Issue type distribution
    const issueTypeQuery = `
      SELECT 
        issueType,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Maintenance), 1) as percentage
      FROM Maintenance 
      GROUP BY issueType
      ORDER BY count DESC
    `;
    const issueTypeResult = await query(issueTypeQuery);

    // Status distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Maintenance), 1) as percentage
      FROM Maintenance 
      GROUP BY status
    `;
    const statusResult = await query(statusQuery);

    // Average resolution time by issue type
    const resolutionTimeQuery = `
      SELECT 
        issueType,
        AVG(DATEDIFF(HOUR, reportedDate, resolvedDate)) as avg_resolution_hours,
        COUNT(*) as total_issues
      FROM Maintenance 
      WHERE status = 'RESOLVED' AND resolvedDate IS NOT NULL
      GROUP BY issueType
      ORDER BY avg_resolution_hours DESC
    `;
    const resolutionTimeResult = await query(resolutionTimeQuery);

    // Monthly maintenance requests
    const monthlyQuery = `
      SELECT 
        YEAR(reportedDate) as year,
        MONTH(reportedDate) as month,
        COUNT(*) as request_count
      FROM Maintenance 
      WHERE reportedDate >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY YEAR(reportedDate), MONTH(reportedDate)
      ORDER BY year DESC, month DESC
    `;
    const monthlyResult = await query(monthlyQuery);

    // Cost analysis by issue type
    const costQuery = `
      SELECT 
        issueType,
        COUNT(*) as issue_count,
        SUM(cost) as total_cost,
        AVG(cost) as avg_cost
      FROM Maintenance 
      WHERE cost IS NOT NULL AND cost > 0
      GROUP BY issueType
      ORDER BY total_cost DESC
    `;
    const costResult = await query(costQuery);

    res.json({
      issueTypeDistribution: issueTypeResult,
      statusDistribution: statusResult,
      resolutionTimeByType: resolutionTimeResult,
      monthlyRequests: monthlyResult,
      costAnalysis: costResult,
      totalRequests: issueTypeResult.reduce((sum, item) => sum + item.count, 0),
      totalCost: costResult.reduce((sum, item) => sum + item.total_cost, 0)
    });
  } catch (err) {
    console.error('Maintenance analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  await ensureFeatureTables();

  app.listen(PORT, () => {
    console.log(`✓ Hostel Management System Backend running on http://localhost:${PORT}/api`);
  });
}

startServer();