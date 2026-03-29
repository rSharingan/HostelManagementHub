import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';

const app = express();
const PORT = process.env.PORT || 5000;

const connectionString = 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=HostelManagement;Trusted_Connection=yes;';

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
    const auth = req.headers.authorization || ''
    const token = auth.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // For now just confirm token exists
    res.json({ message: 'Authenticated' })
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' })
  }
})
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
  console.log('NEW APPLY API HIT')
  try {
    const roomId = Number(req.params.id)
    const studentId = 1
    const requestDate = new Date().toISOString()

    await query(
      'INSERT INTO RoomRequests (studentId, roomId, status, requestDate) VALUES (?, ?, ?, ?)',
      [studentId, roomId, 'PENDING', requestDate]
    )

    res.json({ message: 'Request sent to admin' })

  } catch (err) {
    console.error('Apply room error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})
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
