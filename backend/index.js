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

const connectionString = getConnectionString();

app.use(cors());
app.use(express.json());

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

// Simple query helper
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function ensureFeatureTables() {
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
  `)

  await query(`
    IF OBJECT_ID('dbo.Invoices', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Invoices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        studentId INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        dueDate DATETIME2 NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        description VARCHAR(255) NULL
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
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    // For now, assume token contains user info, but we'll use a simple check
    // In a real app, you'd decode the JWT token to get user info
    const isAdmin = token.includes('ADMIN'); // Simple check for demo
    
    // Get rooms with their allocations
    const rooms = await query('SELECT * FROM Rooms');
    
    // For each room, get active allocations and students
    const roomsWithAllocations = await Promise.all(rooms.map(async (room) => {
      const allocations = await query(`
        SELECT a.id, a.studentId, a.checkInDate, a.status as allocationStatus,
               s.name as studentName, s.registrationNumber
        FROM Allocations a
        JOIN Students s ON a.studentId = s.id
        WHERE a.roomId = ? AND a.status = 'ACTIVE'
      `, [room.id]);
      
      // Compute current status based on allocations count vs capacity
      const currentOccupancy = allocations.length;
      const computedStatus = currentOccupancy >= room.capacity ? 'OCCUPIED' : 'AVAILABLE';
      
      // Update room status in DB if different
      if (room.status !== computedStatus) {
        await query('UPDATE Rooms SET status = ? WHERE id = ?', [computedStatus, room.id]);
      }
      
      return {
        ...room,
        status: computedStatus,
        allocatedStudents: allocations.map(a => ({
          id: a.studentId,
          name: a.studentName,
          registrationNumber: a.registrationNumber,
          allocationId: a.id,
          checkInDate: a.checkInDate
        }))
      };
    }));
    
    if (!isAdmin) {
      // For students, only show available rooms
      const availableRooms = roomsWithAllocations.filter(room => room.status === 'AVAILABLE');
      res.json(availableRooms);
    } else {
      res.json(roomsWithAllocations);
    }
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
    const roomId = Number(req.params.id);
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    // Get current user (for demo, assume student id is 1, in real app decode token)
    const studentId = 1; // This should come from decoded token
    
    // Check current allocations for the room
    const currentAllocations = await query('SELECT COUNT(*) as count FROM Allocations WHERE roomId = ? AND status = ?', [roomId, 'ACTIVE']);
    const room = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
    
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const occupancy = currentAllocations[0].count;
    if (occupancy >= room[0].capacity) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }
    
    // Check if student already has an active allocation
    const existingAllocation = await query('SELECT * FROM Allocations WHERE studentId = ? AND status = ?', [studentId, 'ACTIVE']);
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }
    
    // Create allocation
    await query('INSERT INTO Allocations (studentId, roomId, checkInDate, status) VALUES (?, ?, GETDATE(), ?)', [studentId, roomId, 'ACTIVE']);
    
    // Update room status if now full
    const newOccupancy = occupancy + 1;
    const newStatus = newOccupancy >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
    await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);
    
    res.json({ message: 'Room applied successfully' });
  } catch (err) {
    console.error('Apply room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    await query(
      `UPDATE Rooms 
       SET roomNumber = ?, block = ?, floor = ?, capacity = ?, type = ?, rentalCost = ?, status = ?
       WHERE id = ?`,
      [
        payload.roomNumber,
        payload.block,
        payload.floor,
        payload.capacity,
        payload.type,
        payload.rentalCost,
        payload.status || 'AVAILABLE',
        id
      ]
    );

    res.json({ ...payload, id });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM Rooms WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Delete room error:', err);
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

// Maintenance (module routes expected by frontend)
app.get('/api/maintenance', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Maintenance ORDER BY reportedDate DESC');
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
    await query(
      'INSERT INTO Maintenance (description, room, priority, status, reportedDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?)',
      [payload.description, payload.room || '', payload.priority || 'MEDIUM', payload.status || 'PENDING', reportedDate, payload.assignedTo || null]
    );
    res.status(201).json(payload);
  } catch (err) {
    console.error('Create maintenance error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    await query(
      'UPDATE Maintenance SET description = ?, room = ?, priority = ?, status = ?, assignedTo = ? WHERE id = ?',
      [payload.description, payload.room || '', payload.priority || 'MEDIUM', payload.status || 'PENDING', payload.assignedTo || null, id]
    );
    res.json({ ...payload, id });
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
    const result = await query('SELECT * FROM Invoices ORDER BY dueDate DESC');
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
    const result = await query('SELECT * FROM Payments ORDER BY paymentDate DESC');
    res.json(result);
  } catch (err) {
    console.error('Get fee payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
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
    const result = await query("SELECT id, name, email, role FROM Users WHERE role IN ('WARDEN', 'CARETAKER')");
    res.json(result);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query('SELECT id, name, email, role FROM Users WHERE id = ?', [id]);
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
    const existing = await query('SELECT id FROM Users WHERE email = ?', [payload.email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    await query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [payload.name, payload.email, payload.password || 'password', role]
    );
    res.status(201).json({ ...payload, role });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;
    const role = payload.role === 'CARETAKER' ? 'CARETAKER' : 'WARDEN';
    await query(
      'UPDATE Users SET name = ?, email = ?, role = ? WHERE id = ?',
      [payload.name, payload.email, role, id]
    );
    res.json({ ...payload, id, role });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
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
  const requestId = Number(req.params.id)

  const request = await query(
    'SELECT * FROM RoomRequests WHERE id = ?',
    [requestId]
  )

  const { studentId, roomId } = request[0]

  await query(
    'UPDATE RoomRequests SET status = ? WHERE id = ?',
    ['APPROVED', requestId]
  )

  

  res.json({ message: 'Approved successfully' })
})

app.get('/api/reports/occupancy', async (req, res) => {
  try {
    const result = await query('SELECT * FROM OccupancyReport');
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching report' });
  }
});



// Allocations CRUD
app.get('/api/allocations', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.studentId, a.roomId, a.checkInDate, a.checkOutDate, a.status,
             s.name as studentName, s.registrationNumber, s.email as studentEmail,
             r.roomNumber, r.block, r.floor, r.type
      FROM Allocations a
      JOIN Students s ON a.studentId = s.id
      JOIN Rooms r ON a.roomId = r.id
      ORDER BY a.checkInDate DESC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get allocations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/allocations', async (req, res) => {
  try {
    const { studentId, roomId, allocated_date, status = 'ACTIVE' } = req.body;
    
    if (!studentId || !roomId) {
      return res.status(400).json({ message: 'Student and room are required' });
    }
    
    // Check if student already has an active allocation
    const existingAllocation = await query('SELECT * FROM Allocations WHERE studentId = ? AND status = ?', [studentId, 'ACTIVE']);
    if (existingAllocation && existingAllocation.length > 0) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }
    
    // Check room capacity
    const currentAllocations = await query('SELECT COUNT(*) as count FROM Allocations WHERE roomId = ? AND status = ?', [roomId, 'ACTIVE']);
    const room = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
    
    if (!room || room.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const occupancy = currentAllocations[0].count;
    if (occupancy >= room[0].capacity) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }
    
    // Create allocation
    const checkIn = allocated_date || new Date().toISOString();
    await query('INSERT INTO Allocations (studentId, roomId, checkInDate, status) VALUES (?, ?, ?, ?)', [studentId, roomId, checkIn, status]);
    
    // Update room status if now full
    const newOccupancy = occupancy + 1;
    const newStatus = newOccupancy >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
    await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);
    
    res.status(201).json({ message: 'Allocation created successfully' });
  } catch (err) {
    console.error('Create allocation error:', err);
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
    
    const { roomId } = allocation[0];
    
    // Delete allocation
    await query('DELETE FROM Allocations WHERE id = ?', [id]);
    
    // Update room status
    const currentAllocations = await query('SELECT COUNT(*) as count FROM Allocations WHERE roomId = ? AND status = ?', [roomId, 'ACTIVE']);
    const room = await query('SELECT * FROM Rooms WHERE id = ?', [roomId]);
    
    const newOccupancy = currentAllocations[0].count;
    const newStatus = newOccupancy >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
    await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);
    
    res.status(204).send();
  } catch (err) {
    console.error('Delete allocation error:', err);
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

  app.listen(PORT, () => {
    console.log(`✓ Hostel Management System Backend running on http://localhost:${PORT}/api`);
  });
}

startServer();