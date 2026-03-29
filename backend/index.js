import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

function getConnectionString() {
  const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
  const database = process.env.DB_NAME || 'HostelManagement';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const useTrusted = String(process.env.DB_TRUSTED_CONNECTION || 'true').toLowerCase() !== 'false';

  if (useTrusted) {
    return `Driver={SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
  }

  if (!useTrusted && user && password) {
    return `Driver={SQL Server};Server=${server};Database=${database};Uid=${user};Pwd=${password};TrustServerCertificate=yes;`;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('sqlserver://')) {
    // Accept Prisma-style SQL Server URL to avoid duplicate env configuration.
    const withoutProtocol = databaseUrl.slice('sqlserver://'.length);
    const [authHostPart, queryPart = ''] = withoutProtocol.split(';', 2);
    const atIndex = authHostPart.lastIndexOf('@');

    if (atIndex > -1) {
      const authPart = authHostPart.slice(0, atIndex);
      const hostPart = authHostPart.slice(atIndex + 1);
      const [urlUser, urlPassword = ''] = authPart.split(':');
      const [urlServer = 'localhost'] = hostPart.split(':');

      const dbMatch = /database=([^;]+)/i.exec(queryPart);
      const trustMatch = /trustServerCertificate=([^;]+)/i.exec(queryPart);
      const urlDatabase = dbMatch ? dbMatch[1] : 'HostelManagement';
      const trustServerCertificate = trustMatch ? trustMatch[1] : 'yes';

      if (urlUser) {
        return `Driver={SQL Server};Server=${urlServer};Database=${urlDatabase};Uid=${urlUser};Pwd=${urlPassword};TrustServerCertificate=${trustServerCertificate};`;
      }
    }
  }

  return `Driver={SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;TrustServerCertificate=yes;`;
}

const connectionString = getConnectionString();

function createDevToken(user) {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
}

function parseDevToken(token) {
  try {
    const payload = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  req.user = token ? parseDevToken(token) : null;
  next();
});

// Database connection
let conn;

async function connectDB() {
  try {
    console.log('Connecting to MS SQL Server:', connectionString);
    conn = await new Promise((resolve, reject) => {
      sql.open(connectionString, (err, db) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
    console.log('✓ Connected to MS SQL Server successfully');
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  }
}

async function ensureSchema() {
  await query(`
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'WARDEN', 'ACCOUNTANT', 'CARETAKER', 'STUDENT'))
      )
    END
  `);

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
  `);

  await query(`
    IF OBJECT_ID('dbo.Rooms', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Rooms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        roomNumber NVARCHAR(50) NOT NULL,
        block NVARCHAR(20) NOT NULL,
        floor INT NOT NULL,
        capacity INT NOT NULL,
        type NVARCHAR(50) NOT NULL,
        rentalCost DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        studentId INT NULL,
        CONSTRAINT FK_Rooms_Students FOREIGN KEY (studentId) REFERENCES dbo.Students(id)
      )
    END
  `);

  await query(`
    IF OBJECT_ID('dbo.Maintenance', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Maintenance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        description NVARCHAR(MAX) NOT NULL,
        room NVARCHAR(50) NULL,
        priority NVARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        reportedDate DATETIME2 NOT NULL,
        assignedTo INT NULL
      )
    END
  `);

  await query(`
    IF OBJECT_ID('dbo.Payments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Payments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        invoiceId INT NULL,
        studentId INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paymentDate DATETIME2 NOT NULL,
        method NVARCHAR(50) NOT NULL DEFAULT 'CASH',
        reference NVARCHAR(100) NULL
      )
    END
  `);

  await query(`
    IF OBJECT_ID('dbo.RoomRequests', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.RoomRequests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        roomId INT NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        requestDate DATETIME2 NOT NULL,
        CONSTRAINT FK_RoomRequests_Students FOREIGN KEY (studentId) REFERENCES dbo.Students(id),
        CONSTRAINT FK_RoomRequests_Rooms FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)
      )
    END
  `);

  await query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = ?)
    BEGIN
      INSERT INTO dbo.Users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    END
  `, ['admin@hostel.com', 'Admin', 'admin@hostel.com', 'password', 'ADMIN']);
}

// Simple query helper
async function query(sqlText, params = []) {
  if (!conn) {
    const connected = await connectDB();
    if (!connected) throw new Error('Database not connected');
  }

  let attempt = 0;
  while (attempt < 2) {
    attempt += 1;
    try {
      const result = await new Promise((resolve, reject) => {
        conn.query(sqlText, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return result;
    } catch (err) {
      const message = String(err.message || err);
      if (attempt === 1 && /communication link failure|general network error/i.test(message)) {
        console.warn('Database network issue, reconnecting and retrying query:', message);
        conn = null;
        const reconnected = await connectDB();
        if (!reconnected) throw err;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Failed to execute query after retries');
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
    await query('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role]);

    // Add to respective tables
    if (role === 'STUDENT') {
      await query(
        'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, extra.phone || '', extra.registrationNumber || '', extra.department || '', extra.yearOfStudy || 1, 'ACTIVE', password]
      );
    }

    const users = await query('SELECT TOP 1 id, name, email, role FROM Users WHERE email = ?', [email]);
    const user = users[0];
    const token = createDevToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    res.status(201).json({ token, user });
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

    const user = { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role };
    const token = createDevToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

app.get('/api/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await query('SELECT 1 as ok');
    res.json({ ok: true, message: 'Database connected' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message || 'Database not connected' });
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
    await query(
      'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [payload.name, payload.email, payload.phone || '', payload.registrationNumber || '', payload.department || '', payload.yearOfStudy || 1, payload.status || 'ACTIVE', payload.password || 'password']
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rooms CRUD
app.get('/api/rooms', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    
    let queryStr = 'SELECT * FROM Rooms';
    let params = [];
    
    if (!isAdmin) {
      // For students, only show available rooms
      queryStr += ' WHERE status = ?';
      params.push('AVAILABLE');
    }
    
    const result = await query(queryStr, params);
    res.json(result);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const payload = req.body;
    await query(
      'INSERT INTO Rooms (roomNumber, block, floor, capacity, type, rentalCost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [payload.roomNumber, payload.block, payload.floor, payload.capacity, payload.type, payload.rentalCost, payload.status || 'AVAILABLE']
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms/:id/apply', async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roomId = Number(req.params.id);
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({ message: 'Invalid room id' });
    }

    const room = await query('SELECT id, status FROM Rooms WHERE id = ?', [roomId]);
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room[0].status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    const students = await query('SELECT id FROM Students WHERE email = ?', [req.user.email]);

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = students[0].id;

    const existingRequest = await query(
      'SELECT TOP 1 id FROM RoomRequests WHERE studentId = ? AND roomId = ? AND status = ?',
      [studentId, roomId, 'PENDING']
    );

    if (existingRequest && existingRequest.length > 0) {
      return res.status(409).json({ message: 'You already have a pending request for this room' });
    }

    await query(
      'INSERT INTO RoomRequests (studentId, roomId, status, requestDate) VALUES (?, ?, ?, ?)',
      [studentId, roomId, 'PENDING', new Date().toISOString()]
    );

    res.status(201).json({ message: 'Room request submitted' });
  } catch (err) {
    console.error('Apply room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Complaints (using Maintenance table)
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Maintenance');
    res.json(result);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const payload = req.body;
    const reportedDate = new Date().toISOString();
    await query(
      'INSERT INTO Maintenance (description, room, priority, status, reportedDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.description, payload.room || '', payload.priority || 'MEDIUM', 'PENDING', reportedDate, payload.assignedTo || null]
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create complaint error:', err);
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

// Allocations Summary
app.get('/api/allocations/summary', async (req, res) => {
  try {
    const available = await query("SELECT TOP 5 * FROM Rooms WHERE status = 'AVAILABLE'");
    const booked = await query("SELECT TOP 5 * FROM Rooms WHERE status = 'OCCUPIED'");
    res.json({ available, booked });
  } catch (err) {
    console.error('Get allocations summary error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
/* =========================
   ADMIN VIEW REQUESTS
========================= */

app.get('/api/room-requests', async (req, res) => {
  try {
    const result = await query(`
      SELECT rr.id, rr.status,
             s.name AS studentName,
             r.roomNumber
      FROM RoomRequests rr
      JOIN Students s ON rr.studentId = s.id
      JOIN Rooms r ON rr.roomId = r.id
    `);

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
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const request = await query('SELECT * FROM RoomRequests WHERE id = ?', [requestId]);
    if (!request || request.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const { studentId, roomId, status } = request[0];
    if (status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot approve request in ${status} state` });
    }

    await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['APPROVED', requestId]);
    await query('UPDATE Rooms SET status = ?, studentId = ? WHERE id = ?', ['OCCUPIED', studentId, roomId]);

    res.json({ message: 'Approved successfully' });
  } catch (err) {
    console.error('Approve room request error:', err);
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

  try {
    await ensureSchema();
    console.log('✓ Database schema verified');
  } catch (err) {
    console.error('✗ Database schema initialization failed:', err.message || err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✓ Hostel Management System Backend running on http://localhost:${PORT}/api`);
  });
}

startServer();
