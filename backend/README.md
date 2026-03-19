# Hostel Management System Backend

This is the backend API for the Hostel Management System, built with Express.js and MS SQL Server.

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup:**
   - Make sure you have MS SQL Server installed and running
   - Run the `database-setup.sql` script in your MS SQL Server to create the database and tables
   - Update the database configuration in `index.js` with your MS SQL Server credentials

3. **Environment Variables (Optional):**
   You can set the following environment variables:
   - `DB_USER`: Database username
   - `DB_PASSWORD`: Database password
   - `DB_SERVER`: Database server (default: localhost)
   - `DB_NAME`: Database name (default: HostelManagement)
   - `PORT`: Server port (default: 3000)

4. **Start the Server:**
   ```bash
   npm start
   ```

The server will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/me` - Get current user info

### Students
- `GET /api/students` - Get all students (with optional search query)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Complaints
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Create new complaint
- `PUT /api/complaints/:id` - Update complaint

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment

### Users
- `GET /api/users` - Get all users (except admin)
