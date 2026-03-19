import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';

const app = express();
const PORT = process.env.PORT || 3000;

// MS SQL Configuration
// Using SQL Server Authentication for local development
const config = {
  server: 'localhost',
  port: 1433,
  database: 'HostelManagement',
  user: 'hosteluser',
  password: 'password123',
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};

app.use(cors());
app.use(express.json());

// Database connection
let pool;

async function connectDB() {
  try {
    console.log('Connecting to MS SQL Server with config:', {
      server: config.server,
      database: config.database,
      user: config.user,
    });

    pool = await sql.connect(config);
    console.log('Connected to MS SQL Server successfully');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

// Start server after database connection
async function startServer() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Hostel Management System started`);
    console.log(`Mock backend listening on http://localhost:${PORT}/api`);
  });
}

startServer();

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, ...extra } = req.body;

    // Check if user already exists
    const existingUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Insert user
    const userResult = await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('role', sql.VarChar, role)
      .query('INSERT INTO Users (name, email, password, role) OUTPUT INSERTED.id VALUES (@name, @email, @password, @role)');

    const userId = userResult.recordset[0].id;

    // Add to respective tables
    if (role === 'STUDENT') {
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('phone', sql.VarChar, extra.phone || '')
        .input('registrationNumber', sql.VarChar, extra.registrationNumber || '')
        .input('department', sql.VarChar, extra.department || '')
        .input('yearOfStudy', sql.Int, extra.yearOfStudy || 1)
        .input('status', sql.VarChar, 'ACTIVE')
        .input('password', sql.VarChar, password)
        .query('INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) VALUES (@name, @email, @phone, @registrationNumber, @department, @yearOfStudy, @status, @password)');
    }

    res.status(201).json({ token: `mock-token-${userId}`, user: { id: userId, name, email, role } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM Users WHERE email = @email AND password = @password');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.recordset[0];
    return res.json({ token: `mock-token-${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    const userId = token.replace('mock-token-', '');
    const userResult = await pool.request()
      .input('id', sql.Int, Number(userId))
      .query('SELECT * FROM Users WHERE id = @id');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = userResult.recordset[0];
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Students CRUD
app.get('/api/students', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    let query = 'SELECT * FROM Students';
    let request = pool.request();

    if (q) {
      query += ' WHERE LOWER(name) LIKE @q OR LOWER(email) LIKE @q OR LOWER(registrationNumber) LIKE @q';
      request = request.input('q', sql.VarChar, `%${q}%`);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('SELECT * FROM Students WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const payload = req.body;
    const result = await pool.request()
      .input('name', sql.VarChar, payload.name)
      .input('email', sql.VarChar, payload.email)
      .input('phone', sql.VarChar, payload.phone || '')
      .input('registrationNumber', sql.VarChar, payload.registrationNumber || '')
      .input('department', sql.VarChar, payload.department || '')
      .input('yearOfStudy', sql.Int, payload.yearOfStudy || 1)
      .input('status', sql.VarChar, payload.status || 'ACTIVE')
      .input('password', sql.VarChar, payload.password || 'password')
      .query('INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password) OUTPUT INSERTED.* VALUES (@name, @email, @phone, @registrationNumber, @department, @yearOfStudy, @status, @password)');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    let query = 'UPDATE Students SET ';
    const updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (payload.name !== undefined) {
      updates.push('name = @name');
      request.input('name', sql.VarChar, payload.name);
    }
    if (payload.email !== undefined) {
      updates.push('email = @email');
      request.input('email', sql.VarChar, payload.email);
    }
    if (payload.phone !== undefined) {
      updates.push('phone = @phone');
      request.input('phone', sql.VarChar, payload.phone);
    }
    if (payload.registrationNumber !== undefined) {
      updates.push('registrationNumber = @registrationNumber');
      request.input('registrationNumber', sql.VarChar, payload.registrationNumber);
    }
    if (payload.department !== undefined) {
      updates.push('department = @department');
      request.input('department', sql.VarChar, payload.department);
    }
    if (payload.yearOfStudy !== undefined) {
      updates.push('yearOfStudy = @yearOfStudy');
      request.input('yearOfStudy', sql.Int, payload.yearOfStudy);
    }
    if (payload.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar, payload.status);
    }
    if (payload.password !== undefined) {
      updates.push('password = @password');
      request.input('password', sql.VarChar, payload.password);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    query += updates.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Students WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rooms CRUD
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Rooms');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('SELECT * FROM Rooms WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const payload = req.body;
    const result = await pool.request()
      .input('roomNumber', sql.VarChar, payload.roomNumber)
      .input('block', sql.VarChar, payload.block)
      .input('floor', sql.Int, payload.floor)
      .input('capacity', sql.Int, payload.capacity)
      .input('type', sql.VarChar, payload.type)
      .input('rentalCost', sql.Decimal(10,2), payload.rentalCost)
      .input('status', sql.VarChar, payload.status || 'AVAILABLE')
      .query('INSERT INTO Rooms (roomNumber, block, floor, capacity, type, rentalCost, status) OUTPUT INSERTED.* VALUES (@roomNumber, @block, @floor, @capacity, @type, @rentalCost, @status)');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    let query = 'UPDATE Rooms SET ';
    const updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (payload.roomNumber !== undefined) {
      updates.push('roomNumber = @roomNumber');
      request.input('roomNumber', sql.VarChar, payload.roomNumber);
    }
    if (payload.block !== undefined) {
      updates.push('block = @block');
      request.input('block', sql.VarChar, payload.block);
    }
    if (payload.floor !== undefined) {
      updates.push('floor = @floor');
      request.input('floor', sql.Int, payload.floor);
    }
    if (payload.capacity !== undefined) {
      updates.push('capacity = @capacity');
      request.input('capacity', sql.Int, payload.capacity);
    }
    if (payload.type !== undefined) {
      updates.push('type = @type');
      request.input('type', sql.VarChar, payload.type);
    }
    if (payload.rentalCost !== undefined) {
      updates.push('rentalCost = @rentalCost');
      request.input('rentalCost', sql.Decimal(10,2), payload.rentalCost);
    }
    if (payload.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar, payload.status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    query += updates.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Rooms WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Complaints CRUD (using Maintenance table)
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Maintenance');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const payload = req.body;
    const result = await pool.request()
      .input('description', sql.VarChar, payload.description)
      .input('room', sql.VarChar, payload.room || '')
      .input('priority', sql.VarChar, payload.priority || 'MEDIUM')
      .input('status', sql.VarChar, 'PENDING')
      .input('reportedDate', sql.DateTime, new Date().toISOString())
      .input('assignedTo', sql.Int, payload.assignedTo || null)
      .query('INSERT INTO Maintenance (description, room, priority, status, reportedDate, assignedTo) OUTPUT INSERTED.* VALUES (@description, @room, @priority, @status, @reportedDate, @assignedTo)');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payload = req.body;

    let query = 'UPDATE Maintenance SET ';
    const updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (payload.description !== undefined) {
      updates.push('description = @description');
      request.input('description', sql.VarChar, payload.description);
    }
    if (payload.room !== undefined) {
      updates.push('room = @room');
      request.input('room', sql.VarChar, payload.room);
    }
    if (payload.priority !== undefined) {
      updates.push('priority = @priority');
      request.input('priority', sql.VarChar, payload.priority);
    }
    if (payload.status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.VarChar, payload.status);
    }
    if (payload.assignedTo !== undefined) {
      updates.push('assignedTo = @assignedTo');
      request.input('assignedTo', sql.Int, payload.assignedTo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    query += updates.join(', ') + ' OUTPUT INSERTED.* WHERE id = @id';

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update complaint error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payments/Rents
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Payments');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const payload = req.body;
    const paymentDate = new Date().toISOString();

    const result = await pool.request()
      .input('invoiceId', sql.Int, payload.invoiceId || null)
      .input('studentId', sql.Int, payload.studentId)
      .input('amount', sql.Decimal(10,2), payload.amount)
      .input('paymentDate', sql.DateTime, paymentDate)
      .input('method', sql.VarChar, payload.method || 'CASH')
      .input('reference', sql.VarChar, payload.reference || '')
      .query('INSERT INTO Payments (invoiceId, studentId, amount, paymentDate, method, reference) OUTPUT INSERTED.* VALUES (@invoiceId, @studentId, @amount, @paymentDate, @method, @reference)');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Users (for admin to manage wardens and caretakers)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT * FROM Users WHERE role != \'ADMIN\'');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Hostel Management System started`);
  console.log(`Mock backend listening on http://localhost:${PORT}/api`);
});