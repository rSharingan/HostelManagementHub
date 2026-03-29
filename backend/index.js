import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';

const app = express();
const PORT = process.env.PORT || 3000;

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
async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
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
  try {
    const roomId = Number(req.params.id);
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    
    // Get current user (for demo, assume student id is 1, in real app decode token)
    const studentId = 1; // This should come from decoded token
    
    // Check if room is available
    const roomCheck = await query('SELECT * FROM Rooms WHERE id = ? AND status = ?', [roomId, 'AVAILABLE']);
    if (!roomCheck || roomCheck.length === 0) {
      return res.status(400).json({ message: 'Room is not available' });
    }
    
    // Update room to occupied and assign to student
    await query('UPDATE Rooms SET status = ?, studentId = ? WHERE id = ?', ['OCCUPIED', studentId, roomId]);
    
    res.json({ message: 'Room applied successfully' });
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
