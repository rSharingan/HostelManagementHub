import express from 'express';
import cors from 'cors';
import sql from 'msnodesqlv8';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || `http://localhost:${PORT}`;
const CARETAKER_FIXED_SALARY = Number(process.env.CARETAKER_FIXED_SALARY || 10000);
const WARDEN_FIXED_SALARY = Number(process.env.WARDEN_FIXED_SALARY || 20000);
const ROOM_CHANGE_MIN_DAYS = 31;
const SHARED_BASE_RENT = Number(process.env.SHARED_BASE_RENT || 2000);
const SINGLE_BASE_RENT = Number(process.env.SINGLE_BASE_RENT || 4000);
const INITIAL_BALANCE_DEFAULT = Number(process.env.INITIAL_BALANCE_DEFAULT || 10000);
const INITIAL_BALANCE_ADMIN = Number(process.env.INITIAL_BALANCE_ADMIN || 100000);
const ROOM_ATTRIBUTE_SURCHARGES = {
  hasAC: Number(process.env.RENT_AC_SURCHARGE || 1200),
  hasWifi: Number(process.env.RENT_WIFI_SURCHARGE || 300),
  hasBalcony: Number(process.env.RENT_BALCONY_SURCHARGE || 500),
  hasAttachedBathroom: Number(process.env.RENT_ATTACHED_BATH_SURCHARGE || 800),
};

const BKASH_SANDBOX_BASE_URL = process.env.BKASH_SANDBOX_BASE_URL || 'https://checkout.sandbox.bka.sh/v1.2.0-beta';
const BKASH_SANDBOX_TOKEN_URL = process.env.BKASH_SANDBOX_TOKEN_URL || `${BKASH_SANDBOX_BASE_URL}/tokenized/checkout/token/grant?grant_type=client_credentials`;
const BKASH_SANDBOX_CREATE_URL = process.env.BKASH_SANDBOX_CREATE_URL || `${BKASH_SANDBOX_BASE_URL}/checkout/payment/create`;
const BKASH_SANDBOX_APP_KEY = process.env.BKASH_SANDBOX_APP_KEY;
const BKASH_SANDBOX_APP_SECRET = process.env.BKASH_SANDBOX_APP_SECRET;

const NAGAD_SANDBOX_INITIATE_URL = process.env.NAGAD_SANDBOX_INITIATE_URL;
const NAGAD_SANDBOX_STATUS_URL = process.env.NAGAD_SANDBOX_STATUS_URL;
const NAGAD_MERCHANT_ID = process.env.NAGAD_SANDBOX_MERCHANT_ID;
const NAGAD_API_KEY = process.env.NAGAD_SANDBOX_API_KEY;
const NAGAD_API_SECRET = process.env.NAGAD_SANDBOX_API_SECRET;

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
app.use(express.urlencoded({ extended: true }));

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch (err) {
    throw new Error(`Invalid JSON response from ${url}: ${body}`);
  }

  if (!response.ok) {
    const message = parsed?.message || parsed?.error || body || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}

async function createBkashSandboxPayment({ transactionId, amount, invoiceId, studentId, returnUrl }) {
  if (!BKASH_SANDBOX_APP_KEY || !BKASH_SANDBOX_APP_SECRET) {
    throw new Error('bKash sandbox credentials are not configured.')
  }

  const tokenPayload = {
    app_key: BKASH_SANDBOX_APP_KEY,
    app_secret: BKASH_SANDBOX_APP_SECRET,
  };

  const tokenResponse = await fetchJson(BKASH_SANDBOX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokenPayload),
  });

  const authToken = tokenResponse?.id_token || tokenResponse?.idToken || tokenResponse?.token || tokenResponse?.access_token;
  if (!authToken) {
    throw new Error('Unable to obtain bKash sandbox access token.')
  }

  const createPayload = {
    amount: String(amount),
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: transactionId,
    callbackURL: returnUrl,
    merchantAssociationInfo: transactionId,
  };

  const createResponse = await fetchJson(BKASH_SANDBOX_CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken,
      'X-APP-Key': BKASH_SANDBOX_APP_KEY,
    },
    body: JSON.stringify(createPayload),
  });

  return createResponse?.paymentURL || createResponse?.redirectUrl || createResponse?.bkashURL || createResponse?.checkoutURL || createResponse?.url;
}

async function createNagadSandboxPayment({ transactionId, amount, invoiceId, studentId, returnUrl }) {
  if (!NAGAD_MERCHANT_ID || !NAGAD_API_KEY) {
    throw new Error('Nagad sandbox credentials are not configured.')
  }
  if (!NAGAD_SANDBOX_INITIATE_URL) {
    throw new Error('Nagad sandbox initiate URL is not configured.')
  }

  const createPayload = {
    merchantId: NAGAD_MERCHANT_ID,
    amount: String(amount),
    currency: 'BDT',
    invoiceNumber: transactionId,
    callbackUrl: returnUrl,
    customerReference: String(studentId),
  };

  const createResponse = await fetchJson(NAGAD_SANDBOX_INITIATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': NAGAD_API_KEY,
      ...(NAGAD_API_SECRET ? { 'X-API-SECRET': NAGAD_API_SECRET } : {}),
    },
    body: JSON.stringify(createPayload),
  });

  return createResponse?.paymentURL || createResponse?.redirectUrl || createResponse?.checkoutURL || createResponse?.url;
}

async function getPaymentProviderRedirectUrl({ method, transactionId, amount, invoiceId, studentId, returnUrl }) {
  if (method === 'NAGAD') {
    return await createNagadSandboxPayment({ transactionId, amount, invoiceId, studentId, returnUrl });
  }

  return await createBkashSandboxPayment({ transactionId, amount, invoiceId, studentId, returnUrl });
}

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

function getCurrentCycle() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function resolveStaffSalary(role) {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'CARETAKER') {
    return CARETAKER_FIXED_SALARY;
  }
  if (normalizedRole === 'WARDEN') {
    return WARDEN_FIXED_SALARY;
  }

  return 0;
}

async function getUserRoleById(userId) {
  const resolvedUserId = toNullableInt(userId);
  if (!resolvedUserId) {
    return null;
  }

  const result = await query('SELECT TOP 1 id, role FROM Users WHERE id = ?', [resolvedUserId]);
  return result && result.length > 0 ? result[0] : null;
}

function normalizeStaffProfileRow(row) {
  if (!row) {
    return row;
  }

  const normalizedShift = row.shift ?? row.shiftName ?? row.Column7 ?? null;
  const normalized = {
    ...row,
    shift: normalizedShift,
    salary: resolveStaffSalary(row.role, row.salary),
  };
  if (Object.prototype.hasOwnProperty.call(normalized, 'Column7')) {
    delete normalized.Column7;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'shiftName')) {
    delete normalized.shiftName;
  }

  return normalized;
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
    `SELECT TOP 1 a.*, r.roomNumber, r.rentalCost, r.id AS resolvedRoomId,
            b.bedNumber
     FROM Allocations a
     LEFT JOIN Rooms r ON a.roomId = r.id
     LEFT JOIN Beds b ON a.bedId = b.id
     WHERE a.studentId = ? AND a.status = 'ACTIVE'
     ORDER BY a.checkInDate DESC, a.id DESC`,
    [studentId]
  );

  return result && result.length > 0 ? result[0] : null;
}

async function getRoomChangeEligibility(studentId, allocation = null) {
  const activeAllocation = allocation || await getActiveAllocationForStudent(studentId);
  if (!activeAllocation) {
    return {
      hasActiveAllocation: false,
      canRequestRoomChange: true,
      daysUsed: 0,
      daysUntilRoomChangeAllowed: 0,
      roomChangeEligibleAt: null,
    };
  }

  const daysRow = await query('SELECT DATEDIFF(day, ?, GETDATE()) AS daysUsed', [activeAllocation.checkInDate]);
  const daysUsed = Math.max(0, Number(daysRow?.[0]?.daysUsed || 0));
  const daysUntilRoomChangeAllowed = Math.max(0, ROOM_CHANGE_MIN_DAYS - daysUsed);
  const roomChangeEligibleAt = new Date(activeAllocation.checkInDate);
  roomChangeEligibleAt.setDate(roomChangeEligibleAt.getDate() + ROOM_CHANGE_MIN_DAYS);

  return {
    hasActiveAllocation: true,
    canRequestRoomChange: daysUntilRoomChangeAllowed === 0,
    daysUsed,
    daysUntilRoomChangeAllowed,
    roomChangeEligibleAt,
  };
}

function normalizeRoomType(type) {
  const normalized = String(type || '').trim().toUpperCase();
  if (!normalized) {
    return 'SHARED';
  }
  if (['SINGLE', 'PRIVATE'].includes(normalized)) {
    return 'SINGLE';
  }
  return 'SHARED';
}

function calculateRoomRentFromAttributes({ type, hasAC, hasWifi, hasBalcony, hasAttachedBathroom }) {
  const roomType = normalizeRoomType(type);
  let rent = roomType === 'SINGLE' ? SINGLE_BASE_RENT : SHARED_BASE_RENT;
  if (toBit(hasAC, 0) === 1) rent += ROOM_ATTRIBUTE_SURCHARGES.hasAC;
  if (toBit(hasWifi, 0) === 1) rent += ROOM_ATTRIBUTE_SURCHARGES.hasWifi;
  if (toBit(hasBalcony, 0) === 1) rent += ROOM_ATTRIBUTE_SURCHARGES.hasBalcony;
  if (toBit(hasAttachedBathroom, 0) === 1) rent += ROOM_ATTRIBUTE_SURCHARGES.hasAttachedBathroom;
  return rent;
}

function getInitialBalanceByRole(role) {
  return String(role || '').toUpperCase() === 'ADMIN' ? INITIAL_BALANCE_ADMIN : INITIAL_BALANCE_DEFAULT;
}

async function getReservedSeatCountForRoom(roomId, excludeRequestId = null) {
  let sqlText = `
    SELECT COUNT(*) AS count
    FROM RoomRequests
    WHERE roomId = ?
      AND status IN ('PENDING', 'APPROVED_WAITING_SHIFT')`;
  const params = [roomId];

  if (excludeRequestId !== null && excludeRequestId !== undefined) {
    sqlText += ' AND id <> ?';
    params.push(excludeRequestId);
  }

  const rows = await query(sqlText, params);
  return Math.max(0, Number(rows?.[0]?.count || 0));
}

async function recalculateRoomRents() {
  const rooms = await query('SELECT id, type, hasAC, hasWifi, hasBalcony, hasAttachedBathroom, rentalCost FROM Rooms');
  for (const room of rooms || []) {
    const computedRent = calculateRoomRentFromAttributes(room);
    const currentRent = Number(room.rentalCost || 0);
    if (currentRent !== computedRent) {
      await query('UPDATE Rooms SET rentalCost = ? WHERE id = ?', [computedRent, room.id]);
    }
  }
}

async function getNextRegistrationNumber() {
  const result = await query(`
    SELECT ISNULL(
      MAX(
        TRY_CAST(
          CASE
            WHEN UPPER(registrationNumber) LIKE 'REG%'
              AND PATINDEX('%[0-9]%', registrationNumber) > 0
            THEN SUBSTRING(registrationNumber, PATINDEX('%[0-9]%', registrationNumber), LEN(registrationNumber))
            ELSE NULL
          END AS INT
        )
      ),
      0
    ) AS maxReg
    FROM Students WITH (UPDLOCK, HOLDLOCK)
  `);

  const maxReg = Number(result?.[0]?.maxReg || 0);
  return `REG-${maxReg + 1}`;
}

async function normalizeStudentRegistrationNumbers() {
  await query(`
    ;WITH OrderedStudents AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
      FROM Students
    )
    UPDATE s
    SET registrationNumber = CONCAT('REG-', os.rn)
    FROM Students s
    INNER JOIN OrderedStudents os ON os.id = s.id
  `);
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
  const reservedSeats = await getReservedSeatCountForRoom(roomId);
  const newStatus = (occupancy + reservedSeats) >= room.capacity ? 'OCCUPIED' : 'AVAILABLE';
  await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);
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
  await ensureColumnExists('Users', 'balance', `balance DECIMAL(12,2) NOT NULL DEFAULT ${INITIAL_BALANCE_DEFAULT}`)

  await query(`
    IF NOT EXISTS (
      SELECT 1
      FROM sys.default_constraints dc
      INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
      INNER JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = 'Users'
        AND c.name = 'balance'
        AND dc.definition LIKE '%10000%'
        AND dc.definition NOT LIKE '%100000%'
    )
    BEGIN
      DECLARE @dcName NVARCHAR(200);
      SELECT TOP 1 @dcName = dc.name
      FROM sys.default_constraints dc
      INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
      INNER JOIN sys.tables t ON t.object_id = c.object_id
      WHERE t.name = 'Users'
        AND c.name = 'balance';

      IF @dcName IS NOT NULL
      BEGIN
        DECLARE @dropSql NVARCHAR(400);
        SET @dropSql = N'ALTER TABLE dbo.Users DROP CONSTRAINT ' + QUOTENAME(@dcName);
        EXEC sp_executesql @dropSql;
      END

      ALTER TABLE dbo.Users
      ADD CONSTRAINT DF_Users_balance DEFAULT (10000) FOR balance;
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.SchemaMigrations', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SchemaMigrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        migrationKey NVARCHAR(150) NOT NULL UNIQUE,
        appliedAt DATETIME2 NOT NULL DEFAULT GETDATE()
      )
    END
  `)

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

  await ensureColumnExists('Students', 'userId', 'userId INT NULL')

  await query(`
    IF OBJECT_ID('dbo.StaffProfiles', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StaffProfiles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        phone NVARCHAR(20) NULL,
        employmentStatus NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        [shift] NVARCHAR(20) NOT NULL DEFAULT 'DAY',
        specialty NVARCHAR(100) NULL,
        salary DECIMAL(10,2) NULL,
        joinedDate DATE NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES dbo.Users(id)
      )
    END
  `)

  await ensureColumnExists('StaffProfiles', 'phone', 'phone NVARCHAR(20) NULL')
  await ensureColumnExists('StaffProfiles', 'employmentStatus', "employmentStatus NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE'")
  await ensureColumnExists('StaffProfiles', 'shift', "[shift] NVARCHAR(20) NOT NULL DEFAULT 'DAY'")
  await ensureColumnExists('StaffProfiles', 'specialty', 'specialty NVARCHAR(100) NULL')
  await ensureColumnExists('StaffProfiles', 'salary', 'salary DECIMAL(10,2) NULL')
  await ensureColumnExists('StaffProfiles', 'joinedDate', 'joinedDate DATE NULL')

  await query(`
    IF OBJECT_ID('dbo.StaffSalaryPrompts', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StaffSalaryPrompts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        staffUserId INT NOT NULL,
        cycleMonth INT NOT NULL,
        cycleYear INT NOT NULL,
        message NVARCHAR(255) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        resolvedByUserId INT NULL,
        resolved_at DATETIME2 NULL,
        FOREIGN KEY (staffUserId) REFERENCES dbo.Users(id),
        FOREIGN KEY (resolvedByUserId) REFERENCES dbo.Users(id)
      )
    END
  `)

  await ensureColumnExists('StaffSalaryPrompts', 'staffUserId', 'staffUserId INT NOT NULL')
  await ensureColumnExists('StaffSalaryPrompts', 'cycleMonth', 'cycleMonth INT NOT NULL DEFAULT MONTH(GETDATE())')
  await ensureColumnExists('StaffSalaryPrompts', 'cycleYear', 'cycleYear INT NOT NULL DEFAULT YEAR(GETDATE())')
  await ensureColumnExists('StaffSalaryPrompts', 'message', 'message NVARCHAR(255) NULL')
  await ensureColumnExists('StaffSalaryPrompts', 'status', "status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'")
  await ensureColumnExists('StaffSalaryPrompts', 'created_at', 'created_at DATETIME2 NOT NULL DEFAULT GETDATE()')
  await ensureColumnExists('StaffSalaryPrompts', 'resolvedByUserId', 'resolvedByUserId INT NULL')
  await ensureColumnExists('StaffSalaryPrompts', 'resolved_at', 'resolved_at DATETIME2 NULL')

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
  await ensureColumnExists('Maintenance', 'caretakerApprovalStatus', "caretakerApprovalStatus NVARCHAR(50) NOT NULL DEFAULT 'PENDING'")
  await ensureColumnExists('Maintenance', 'caretakerApprovedById', 'caretakerApprovedById INT NULL')
  await ensureColumnExists('Maintenance', 'caretakerApprovedDate', 'caretakerApprovedDate DATETIME2 NULL')
  await ensureColumnExists('Maintenance', 'closedById', 'closedById INT NULL')
  await ensureColumnExists('Maintenance', 'closedDate', 'closedDate DATETIME2 NULL')

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
    IF OBJECT_ID('dbo.StaffPayments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StaffPayments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        staffUserId INT NOT NULL,
        initiatedByUserId INT NULL,
        cycleMonth INT NOT NULL,
        cycleYear INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method NVARCHAR(20) NOT NULL DEFAULT 'BKASH',
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        transaction_id NVARCHAR(100) NULL,
        reference NVARCHAR(150) NULL,
        paidDate DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        notes NVARCHAR(255) NULL,
        FOREIGN KEY (staffUserId) REFERENCES dbo.Users(id),
        FOREIGN KEY (initiatedByUserId) REFERENCES dbo.Users(id)
      )
    END
  `)

  await ensureColumnExists('StaffPayments', 'staffUserId', 'staffUserId INT NOT NULL')
  await ensureColumnExists('StaffPayments', 'initiatedByUserId', 'initiatedByUserId INT NULL')
  await ensureColumnExists('StaffPayments', 'cycleMonth', 'cycleMonth INT NOT NULL DEFAULT 1')
  await ensureColumnExists('StaffPayments', 'cycleYear', 'cycleYear INT NOT NULL DEFAULT YEAR(GETDATE())')
  await ensureColumnExists('StaffPayments', 'amount', 'amount DECIMAL(10,2) NOT NULL DEFAULT 0')
  await ensureColumnExists('StaffPayments', 'method', "method NVARCHAR(20) NOT NULL DEFAULT 'BKASH'")
  await ensureColumnExists('StaffPayments', 'status', "status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'")
  await ensureColumnExists('StaffPayments', 'transaction_id', 'transaction_id NVARCHAR(100) NULL')
  await ensureColumnExists('StaffPayments', 'reference', 'reference NVARCHAR(150) NULL')
  await ensureColumnExists('StaffPayments', 'paidDate', 'paidDate DATETIME2 NULL')
  await ensureColumnExists('StaffPayments', 'created_at', 'created_at DATETIME2 NOT NULL DEFAULT GETDATE()')
  await ensureColumnExists('StaffPayments', 'notes', 'notes NVARCHAR(255) NULL')

  await ensureColumnExists('Payments', 'status', "status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'")
  await ensureColumnExists('Payments', 'transaction_id', 'transaction_id NVARCHAR(100) NULL')
  await ensureColumnExists('Payments', 'created_at', 'created_at DATETIME2 DEFAULT GETDATE()')

  // Note: Foreign keys added conditionally to avoid conflicts with existing data
  // await ensureForeignKey('FK_Payments_Invoices', 'Payments', 'FOREIGN KEY (invoiceId) REFERENCES dbo.Invoices(id)')
  // await ensureForeignKey('FK_Payments_Students', 'Payments', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')

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

  // One-time-safe normalization so existing mixed/manual values become sequential REG-1..REG-n.
  // This updates Students only and does not delete users or break table relationships.
  await normalizeStudentRegistrationNumbers()

  await query(`
    IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.indexes
         WHERE name = 'UX_Students_RegistrationNumber'
           AND object_id = OBJECT_ID('dbo.Students')
       )
       AND NOT EXISTS (
         SELECT registrationNumber
         FROM dbo.Students
         WHERE registrationNumber IS NOT NULL AND registrationNumber <> ''
         GROUP BY registrationNumber
         HAVING COUNT(*) > 1
       )
    BEGIN
      CREATE UNIQUE INDEX UX_Students_RegistrationNumber
      ON dbo.Students(registrationNumber)
      WHERE registrationNumber IS NOT NULL AND registrationNumber <> ''
    END
  `)

  await query(
    `IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = ?)
     BEGIN
       INSERT INTO dbo.Users (name, email, password, role, balance)
       VALUES (?, ?, ?, ?, ?)
     END`,
    ['admin@hostel.com', 'Admin', 'admin@hostel.com', 'password', 'ADMIN', INITIAL_BALANCE_ADMIN]
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

  await query(`
    IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE migrationKey = 'users_balance_role_based_2026_04')
    BEGIN
      UPDATE dbo.Users
      SET balance = CASE WHEN role = 'ADMIN' THEN 100000 ELSE 10000 END;

      INSERT INTO dbo.SchemaMigrations (migrationKey) VALUES ('users_balance_role_based_2026_04');
    END
  `)

  await query(`
    UPDATE dbo.Users
    SET balance = CASE WHEN role = 'ADMIN' THEN 100000 ELSE 10000 END
    WHERE balance IS NULL
  `)

  // Ensure every student has a linked STUDENT user for strict 1:1 User->Student mapping.
  await query(`
    INSERT INTO dbo.Users (name, email, password, role, hostelId)
    SELECT s.name,
           s.email,
           ISNULL(NULLIF(s.password, ''), 'password'),
           'STUDENT',
           NULL
    FROM dbo.Students s
    LEFT JOIN dbo.Users u ON u.email = s.email
    WHERE u.id IS NULL
      AND s.email IS NOT NULL
      AND s.email <> ''
  `)

  await query(`
    UPDATE s
    SET s.userId = u.id
    FROM dbo.Students s
    INNER JOIN dbo.Users u ON u.email = s.email AND u.role = 'STUDENT'
    WHERE s.userId IS NULL
  `)

  await query(`
    ;WITH DuplicateLinks AS (
      SELECT id,
             userId,
             ROW_NUMBER() OVER (PARTITION BY userId ORDER BY id ASC) AS rn
      FROM dbo.Students
      WHERE userId IS NOT NULL
    )
    INSERT INTO dbo.Users (name, email, password, role, hostelId)
    SELECT s.name,
           CONCAT('student', s.id, '@hostel.local'),
           ISNULL(NULLIF(s.password, ''), 'password'),
           'STUDENT',
           NULL
    FROM DuplicateLinks d
    INNER JOIN dbo.Students s ON s.id = d.id
    WHERE d.rn > 1
      AND NOT EXISTS (
        SELECT 1 FROM dbo.Users ux WHERE ux.email = CONCAT('student', s.id, '@hostel.local')
      )
  `)

  await query(`
    ;WITH DuplicateLinks AS (
      SELECT id,
             userId,
             ROW_NUMBER() OVER (PARTITION BY userId ORDER BY id ASC) AS rn
      FROM dbo.Students
      WHERE userId IS NOT NULL
    )
    UPDATE s
    SET s.userId = u.id
    FROM DuplicateLinks d
    INNER JOIN dbo.Students s ON s.id = d.id
    INNER JOIN dbo.Users u ON u.email = CONCAT('student', s.id, '@hostel.local') AND u.role = 'STUDENT'
    WHERE d.rn > 1
  `)

  await query(`
    INSERT INTO dbo.Users (name, email, password, role, hostelId)
    SELECT s.name,
           CONCAT('student', s.id, '@hostel.local'),
           ISNULL(NULLIF(s.password, ''), 'password'),
           'STUDENT',
           NULL
    FROM dbo.Students s
    WHERE s.userId IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM dbo.Users u WHERE u.email = CONCAT('student', s.id, '@hostel.local')
      )
  `)

  await query(`
    UPDATE s
    SET s.userId = u.id
    FROM dbo.Students s
    INNER JOIN dbo.Users u ON u.email = CONCAT('student', s.id, '@hostel.local') AND u.role = 'STUDENT'
    WHERE s.userId IS NULL
  `)

  // Ensure every staff user has exactly one linked profile for strict 1:1 User->Staff mapping.
  await query(`
    INSERT INTO dbo.StaffProfiles (userId)
    SELECT u.id
    FROM dbo.Users u
    WHERE u.role IN ('WARDEN', 'CARETAKER')
      AND NOT EXISTS (
        SELECT 1 FROM dbo.StaffProfiles sp WHERE sp.userId = u.id
      )
  `)

  await ensureForeignKey('FK_Users_Hostels', 'Users', 'FOREIGN KEY (hostelId) REFERENCES dbo.Hostels(id)')
  await ensureForeignKey('FK_Students_Users', 'Students', 'FOREIGN KEY (userId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_StaffProfiles_Users', 'StaffProfiles', 'FOREIGN KEY (userId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_Rooms_Hostels', 'Rooms', 'FOREIGN KEY (hostelId) REFERENCES dbo.Hostels(id)')
  await ensureForeignKey('FK_Beds_Rooms', 'Beds', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')
  await ensureForeignKey('FK_StayRecords_Students', 'StayRecords', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_StayRecords_Beds', 'StayRecords', 'FOREIGN KEY (bedId) REFERENCES dbo.Beds(id)')
  await ensureForeignKey('FK_Allocations_Beds', 'Allocations', 'FOREIGN KEY (bedId) REFERENCES dbo.Beds(id)')
  await ensureForeignKey('FK_RoomRequests_Students', 'RoomRequests', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_RoomRequests_Rooms', 'RoomRequests', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')
  await ensureForeignKey('FK_Payments_Students', 'Payments', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_StaffPayments_StaffUser', 'StaffPayments', 'FOREIGN KEY (staffUserId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_StaffPayments_InitiatedBy', 'StaffPayments', 'FOREIGN KEY (initiatedByUserId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_StaffPrompts_StaffUser', 'StaffSalaryPrompts', 'FOREIGN KEY (staffUserId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_StaffPrompts_ResolvedBy', 'StaffSalaryPrompts', 'FOREIGN KEY (resolvedByUserId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_Maintenance_Students', 'Maintenance', 'FOREIGN KEY (studentId) REFERENCES dbo.Students(id)')
  await ensureForeignKey('FK_Maintenance_Staff', 'Maintenance', 'FOREIGN KEY (staffId) REFERENCES dbo.Users(id)')
  await ensureForeignKey('FK_Maintenance_Rooms', 'Maintenance', 'FOREIGN KEY (roomId) REFERENCES dbo.Rooms(id)')

  await query(`
    IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.indexes
         WHERE name = 'UX_Students_UserId'
           AND object_id = OBJECT_ID('dbo.Students')
       )
       AND NOT EXISTS (
         SELECT userId
         FROM dbo.Students
         WHERE userId IS NOT NULL
         GROUP BY userId
         HAVING COUNT(*) > 1
       )
    BEGIN
      CREATE UNIQUE INDEX UX_Students_UserId
      ON dbo.Students(userId)
      WHERE userId IS NOT NULL
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.StaffProfiles', 'U') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.indexes
         WHERE name = 'UX_StaffProfiles_UserId'
           AND object_id = OBJECT_ID('dbo.StaffProfiles')
       )
    BEGIN
      CREATE UNIQUE INDEX UX_StaffProfiles_UserId
      ON dbo.StaffProfiles(userId)
    END
  `)

  await query(`
    IF OBJECT_ID('dbo.StaffPayments', 'U') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM sys.indexes
         WHERE name = 'IX_StaffPayments_StaffCycle'
           AND object_id = OBJECT_ID('dbo.StaffPayments')
       )
    BEGIN
      CREATE INDEX IX_StaffPayments_StaffCycle
      ON dbo.StaffPayments(staffUserId, cycleYear, cycleMonth)
    END
  `)

  await recalculateRoomRents()
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

    if (role === 'STUDENT') {
      await query('BEGIN TRANSACTION');
      try {
        await query('INSERT INTO Users (name, email, password, role, hostelId, balance) VALUES (?, ?, ?, ?, ?, ?)', [name, email, password, role, null, getInitialBalanceByRole(role)]);
        const insertedUsers = await query('SELECT TOP 1 id FROM Users WHERE email = ? AND role = ? ORDER BY id DESC', [email, 'STUDENT']);
        const linkedUserId = insertedUsers?.[0]?.id || null;
        if (!linkedUserId) {
          throw new Error('Unable to create linked student user');
        }
        const registrationNumber = await getNextRegistrationNumber();
        await query(
          'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [name, email, extra.phone || '', registrationNumber, extra.department || '', extra.yearOfStudy || 1, 'ACTIVE', password, linkedUserId]
        );
        await query('COMMIT TRANSACTION');
      } catch (createErr) {
        await query('ROLLBACK TRANSACTION');
        throw createErr;
      }
    } else {
      // Insert non-student user directly
      await query('INSERT INTO Users (name, email, password, role, hostelId, balance) VALUES (?, ?, ?, ?, ?, ?)', [name, email, password, role, 1, getInitialBalanceByRole(role)]);
    }

    const createdUsers = await query('SELECT TOP 1 id, name, email, role, balance FROM Users WHERE email = ? ORDER BY id DESC', [email]);
    const createdUser = createdUsers?.[0] || { name, email, role, balance: getInitialBalanceByRole(role) };
    res.status(201).json({ token: `token-${Date.now()}`, user: { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: createdUser.role, balance: Number(createdUser.balance || 0) } });
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
    return res.json({ token: `token-${user.id}-${Date.now()}`, user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: Number(user.balance || 0) } });
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
    const email = req.query.email;
    if (email) {
      const rows = await query('SELECT TOP 1 id, name, email, role, balance FROM Users WHERE email = ?', [email]);
      if (rows && rows.length > 0) {
        const user = rows[0];
        return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, balance: Number(user.balance || 0) });
      }
    }

    res.json({ id: 1, name: 'Admin', email: 'admin@hostel.com', role: 'ADMIN', balance: 0 });
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

    await query('BEGIN TRANSACTION');
    try {
      const existingStudent = await query('SELECT TOP 1 id FROM Students WHERE email = ? ORDER BY id DESC', [payload.email]);
      if (existingStudent && existingStudent.length > 0) {
        throw new Error('Student already exists with this email');
      }

      let linkedUserId = null;
      const existingUser = await query('SELECT TOP 1 id, role FROM Users WHERE email = ? ORDER BY id DESC', [payload.email]);
      if (existingUser && existingUser.length > 0) {
        if (existingUser[0].role !== 'STUDENT') {
          throw new Error('Email already belongs to a non-student account');
        }
        linkedUserId = existingUser[0].id;
      } else {
        await query(
          'INSERT INTO Users (name, email, password, role, hostelId, balance) VALUES (?, ?, ?, ?, ?, ?)',
          [payload.name, payload.email, payload.password || 'password', 'STUDENT', null, getInitialBalanceByRole('STUDENT')]
        );
        const insertedUsers = await query('SELECT TOP 1 id FROM Users WHERE email = ? AND role = ? ORDER BY id DESC', [payload.email, 'STUDENT']);
        linkedUserId = insertedUsers?.[0]?.id || null;
      }

      if (!linkedUserId) {
        throw new Error('Unable to create linked student user');
      }

      const registrationNumber = await getNextRegistrationNumber();
      await query(
        'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [payload.name, payload.email, payload.phone || '', registrationNumber, payload.department || '', yearOfStudy, payload.status || 'ACTIVE', payload.password || 'password', linkedUserId]
      );
      await query('COMMIT TRANSACTION');
    } catch (createErr) {
      await query('ROLLBACK TRANSACTION');
      throw createErr;
    }

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

    const existingRows = await query('SELECT TOP 1 id, userId, email FROM Students WHERE id = ?', [id]);
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let linkedUserId = existingRows[0].userId || null;
    if (!linkedUserId) {
      const fallbackUser = await query('SELECT TOP 1 id, role FROM Users WHERE email = ? ORDER BY id DESC', [existingRows[0].email]);
      if (fallbackUser && fallbackUser.length > 0 && fallbackUser[0].role === 'STUDENT') {
        linkedUserId = fallbackUser[0].id;
      }
    }

    if (linkedUserId) {
      const conflictingEmail = await query('SELECT TOP 1 id FROM Users WHERE email = ? AND id <> ?', [payload.email, linkedUserId]);
      if (conflictingEmail && conflictingEmail.length > 0) {
        return res.status(400).json({ message: 'Email already belongs to another user' });
      }

      await query('UPDATE Users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?', [
        payload.name,
        payload.email,
        payload.password || 'password',
        'STUDENT',
        linkedUserId,
      ]);
    }

    await query(
      `UPDATE Students
       SET name = ?, email = ?, phone = ?, department = ?, yearOfStudy = ?, status = ?, password = ?, userId = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone || '',
        payload.department || '',
        yearOfStudy,
        payload.status || 'ACTIVE',
        payload.password || 'password',
        linkedUserId,
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
    const studentRows = await query('SELECT TOP 1 userId FROM Students WHERE id = ?', [id]);
    const linkedUserId = studentRows?.[0]?.userId || null;

    await query('DELETE FROM StayRecords WHERE studentId = ?', [id]);
    await query('DELETE FROM Allocations WHERE studentId = ?', [id]);
    await query('DELETE FROM RoomRequests WHERE studentId = ?', [id]);
    await query('DELETE FROM Maintenance WHERE studentId = ?', [id]);
    await query('DELETE FROM Payments WHERE studentId = ?', [id]);
    await query('DELETE FROM Invoices WHERE studentId = ?', [id]);
    await query('DELETE FROM Students WHERE id = ?', [id]);

    if (linkedUserId) {
      await query("DELETE FROM Users WHERE id = ? AND role = 'STUDENT'", [linkedUserId]);
    }

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
      SELECT a.id, a.studentId, a.roomId, a.bedId, a.checkInDate, a.status as allocationStatus,
             s.name as studentName, s.registrationNumber
             ,b.bedNumber
      FROM Allocations a
      JOIN Students s ON a.studentId = s.id
      LEFT JOIN Beds b ON a.bedId = b.id
      WHERE a.status = 'ACTIVE'
    `);
    const reservedSeatRows = await query(`
      SELECT roomId, COUNT(*) AS reservedSeats
      FROM RoomRequests
      WHERE status IN ('PENDING', 'APPROVED_WAITING_SHIFT')
      GROUP BY roomId
    `);
    const reservedMap = new Map((reservedSeatRows || []).map((row) => [Number(row.roomId), Number(row.reservedSeats || 0)]));

    const roomsWithAllocations = [];
    for (const room of rooms) {
      const allocations = allocationRows.filter((a) => a.roomId === room.id);
      const currentOccupancy = allocations.length;
      const reservedSeats = Number(reservedMap.get(Number(room.id)) || 0);
      const computedStatus = (currentOccupancy + reservedSeats) >= room.capacity ? 'OCCUPIED' : 'AVAILABLE';
      const seatsLeft = Math.max(0, Number(room.capacity || 0) - currentOccupancy - reservedSeats);

      if (room.status !== computedStatus) {
        await query('UPDATE Rooms SET status = ? WHERE id = ?', [computedStatus, room.id]);
      }

      roomsWithAllocations.push({
        ...room,
        status: computedStatus,
        occupiedSeats: currentOccupancy,
        reservedSeats,
        seatsLeft,
        allocatedStudents: allocations.map((a) => ({
          id: a.studentId,
          name: a.studentName,
          registrationNumber: a.registrationNumber,
          allocationId: a.id,
          bedId: a.bedId,
          bedNumber: a.bedNumber,
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

app.get('/api/rooms/check-availability', async (req, res) => {
  try {
    const roomNumber = String(req.query.roomNumber || '').trim();
    const block = String(req.query.block || '').trim();
    const excludeId = toNullableInt(req.query.excludeId);

    if (!roomNumber || !block) {
      return res.status(400).json({ message: 'roomNumber and block are required' });
    }

    const params = [roomNumber, block];
    let sqlText = `
      SELECT TOP 1 id, roomNumber, block
      FROM Rooms
      WHERE LTRIM(RTRIM(roomNumber)) = ?
        AND LTRIM(RTRIM(block)) = ?
    `;

    if (excludeId) {
      sqlText += ' AND id <> ?';
      params.push(excludeId);
    }

    const existing = await query(sqlText, params);
    const available = !existing || existing.length === 0;

    return res.json({
      available,
      roomNumber,
      block,
      existingId: available ? null : Number(existing[0].id),
      message: available
        ? 'Room number is available for this block'
        : 'Room number already exists in this block',
    });
  } catch (err) {
    console.error('Check room availability error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const payload = req.body;
    const roomNumber = String(payload.roomNumber || '').trim();
    const block = String(payload.block || '').trim();
    if (!roomNumber || !block) {
      return res.status(400).json({ message: 'Room number and block are required' });
    }

    const existingRoom = await query(
      'SELECT TOP 1 id FROM Rooms WHERE LTRIM(RTRIM(roomNumber)) = ? AND LTRIM(RTRIM(block)) = ?',
      [roomNumber, block]
    );
    if (existingRoom && existingRoom.length > 0) {
      return res.status(409).json({ message: 'Room number already exists in this block' });
    }

    const floor = toNullableInt(payload.floor);
    const hostelId = toIntOrDefault(payload.hostelId, 1);
    const roomType = normalizeRoomType(payload.type);
    const hasAC = toBit(payload.hasAC, 0);
    const hasAttachedBathroom = toBit(payload.hasAttachedBathroom, 0);
    const hasWifi = toBit(payload.hasWifi, 0);
    const hasBalcony = toBit(payload.hasBalcony, 0);
    const computedRent = calculateRoomRentFromAttributes({
      type: roomType,
      hasAC,
      hasAttachedBathroom,
      hasWifi,
      hasBalcony,
    });
    await query(
      'INSERT INTO Rooms (roomNumber, block, floor, capacity, type, hasAC, hasAttachedBathroom, hasWifi, hasBalcony, rentalCost, status, hostelId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [roomNumber, block, floor, payload.capacity, roomType, hasAC, hasAttachedBathroom, hasWifi, hasBalcony, computedRent, payload.status || 'AVAILABLE', hostelId]
    );
    const insertedRoom = await query('SELECT TOP 1 * FROM Rooms WHERE roomNumber = ? AND block = ? AND floor = ? ORDER BY id DESC', [roomNumber, block, floor]);
    if (insertedRoom && insertedRoom.length > 0) {
      await ensureBedsForRoom(insertedRoom[0].id, toIntOrDefault(payload.capacity, 1));
      res.status(201).json({ ...insertedRoom[0] });
      return;
    }
    res.status(201).json({ ...payload, roomNumber, block, floor, hostelId, type: roomType, rentalCost: computedRent, hasAC, hasAttachedBathroom, hasWifi, hasBalcony });
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

    const activeAllocation = await getActiveAllocationForStudent(studentId);
    if (activeAllocation && Number(activeAllocation.roomId) === roomId) {
      return res.status(400).json({ message: 'You are already allocated to this room' });
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
    const reservedCount = await getReservedSeatCountForRoom(roomId);
    if ((activeCount + reservedCount) >= Number(room[0].capacity || 0)) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    const existingRequest = await query(
      "SELECT * FROM RoomRequests WHERE studentId = ? AND roomId = ? AND status IN ('PENDING', 'APPROVED', 'APPROVED_WAITING_SHIFT')",
      [studentId, roomId]
    );

    if (existingRequest && existingRequest.length > 0) {
      return res.status(400).json({ message: 'You have already requested this room' });
    }

    const activeReservation = await query(
      "SELECT TOP 1 id FROM RoomRequests WHERE studentId = ? AND status IN ('PENDING', 'APPROVED_WAITING_SHIFT') ORDER BY id DESC",
      [studentId]
    );
    if (activeReservation && activeReservation.length > 0) {
      return res.status(400).json({ message: 'You already have an active room reservation request' });
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
    const reservedSeats = await getReservedSeatCountForRoom(id);
    const seatsLeft = Math.max(0, Number(room.capacity || 0) - occupiedSeats - reservedSeats);
    const computedStatus = seatsLeft === 0 ? 'OCCUPIED' : 'AVAILABLE';

    if (room.status !== computedStatus) {
      await query('UPDATE Rooms SET status = ? WHERE id = ?', [computedStatus, id]);
    }

    res.json({
      ...room,
      status: computedStatus,
      occupiedSeats,
      reservedSeats,
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
    const roomNumber = String(payload.roomNumber || '').trim();
    const block = String(payload.block || '').trim();
    if (!roomNumber || !block) {
      return res.status(400).json({ message: 'Room number and block are required' });
    }

    const existingRoom = await query(
      'SELECT TOP 1 id FROM Rooms WHERE LTRIM(RTRIM(roomNumber)) = ? AND LTRIM(RTRIM(block)) = ? AND id <> ?',
      [roomNumber, block, id]
    );
    if (existingRoom && existingRoom.length > 0) {
      return res.status(409).json({ message: 'Room number already exists in this block' });
    }

    const floor = toNullableInt(payload.floor);
    const hostelId = toIntOrDefault(payload.hostelId, 1);
    const roomType = normalizeRoomType(payload.type);
    const hasAC = toBit(payload.hasAC, 0);
    const hasAttachedBathroom = toBit(payload.hasAttachedBathroom, 0);
    const hasWifi = toBit(payload.hasWifi, 0);
    const hasBalcony = toBit(payload.hasBalcony, 0);
    const computedRent = calculateRoomRentFromAttributes({
      type: roomType,
      hasAC,
      hasAttachedBathroom,
      hasWifi,
      hasBalcony,
    });

    await query(
      `UPDATE Rooms 
       SET roomNumber = ?, block = ?, floor = ?, capacity = ?, type = ?, hasAC = ?, hasAttachedBathroom = ?, hasWifi = ?, hasBalcony = ?, rentalCost = ?, status = ?, hostelId = ?
       WHERE id = ?`,
      [
        roomNumber,
        block,
        floor,
        payload.capacity,
        roomType,
        hasAC,
        hasAttachedBathroom,
        hasWifi,
        hasBalcony,
        computedRent,
        payload.status || 'AVAILABLE',
        hostelId,
        id
      ]
    );

    await ensureBedsForRoom(id, toIntOrDefault(payload.capacity, 1));

    res.json({ ...payload, id, roomNumber, block, floor, hostelId, type: roomType, rentalCost: computedRent, hasAC, hasAttachedBathroom, hasWifi, hasBalcony });
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
              m.caretakerApprovalStatus, m.caretakerApprovedById, m.caretakerApprovedDate,
             s.name AS studentName,
              s.email AS studentEmail,
             st.name AS staffName,
             ab.name AS assignedByName,
             rb.name AS resolvedByName,
              cap.name AS caretakerApprovedByName,
             sap.name AS studentApprovedByName,
             r.roomNumber
      FROM Maintenance m
      LEFT JOIN Students s ON m.studentId = s.id
      LEFT JOIN Users st ON m.staffId = st.id OR m.assignedTo = st.id
      LEFT JOIN Users ab ON m.assignedById = ab.id
      LEFT JOIN Users rb ON m.resolvedById = rb.id
            LEFT JOIN Users cap ON m.caretakerApprovedById = cap.id
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
    const actorUser = await getUserRoleById(actorUserId);
    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || '';

    if (payload.action === 'ASSIGN') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'WARDEN') {
        return res.status(403).json({ message: 'Only the warden can assign complaints' });
      }

      if (staffId) {
        const targetStaff = await getUserRoleById(staffId);
        if (!targetStaff || String(targetStaff.role || '').toUpperCase() !== 'CARETAKER') {
          return res.status(400).json({ message: 'Complaints can only be assigned to caretakers' });
        }
      }

      await query(
        `UPDATE Maintenance
         SET room = ?, roomId = ?, staffId = ?, assignedTo = ?, assignedById = ?, assignedDate = GETDATE(),
             status = ?, studentApprovalStatus = ?, caretakerApprovalStatus = ?,
             caretakerApprovedById = NULL, caretakerApprovedDate = NULL,
             studentApprovedById = NULL, studentApprovedDate = NULL,
             resolvedById = NULL, resolvedDate = NULL,
             closedById = NULL, closedDate = NULL
         WHERE id = ?`,
        [roomName, roomId, staffId, staffId, actorUserId, 'ASSIGNED', 'PENDING', 'PENDING', id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'ASSIGN' });
    }

    if (payload.action === 'RESOLVE' || payload.action === 'CARETAKER_APPROVE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'CARETAKER') {
        return res.status(403).json({ message: 'Only the assigned caretaker can mark a complaint resolved' });
      }

      const ownership = await query('SELECT TOP 1 staffId, assignedTo, status FROM Maintenance WHERE id = ?', [id]);
      const assignedStaffId = toNullableInt(ownership?.[0]?.staffId ?? ownership?.[0]?.assignedTo);
      const currentStatus = String(ownership?.[0]?.status || '').toUpperCase();
      if (!assignedStaffId || assignedStaffId !== actorUserId) {
        return res.status(403).json({ message: 'Only the assigned caretaker can approve resolution' });
      }
      if (currentStatus !== 'ASSIGNED') {
        return res.status(400).json({ message: 'Complaint is not in an assignable state for caretaker approval' });
      }

      await query(
        `UPDATE Maintenance
         SET status = ?, resolvedById = ?, resolvedDate = GETDATE(),
             caretakerApprovalStatus = ?, caretakerApprovedById = ?, caretakerApprovedDate = GETDATE()
         WHERE id = ?`,
        ['RESOLVED_PENDING_APPROVAL', actorUserId || staffId, 'APPROVED', actorUserId, id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'RESOLVE' });
    }

    if (payload.action === 'STUDENT_APPROVE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'STUDENT') {
        return res.status(403).json({ message: 'Only the student can approve or reject a complaint resolution' });
      }

      const approvalDecision = String(payload.decision || 'APPROVED').toUpperCase();
      if (approvalDecision === 'REJECTED') {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(),
               caretakerApprovalStatus = ?, caretakerApprovedById = NULL, caretakerApprovedDate = NULL,
               resolvedById = NULL, resolvedDate = NULL,
               status = ?
           WHERE id = ?`,
          ['REJECTED', actorUserId, 'PENDING', 'ASSIGNED', id]
        );
      } else {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(), status = ?, closedById = NULL, closedDate = NULL
           WHERE id = ?`,
          ['APPROVED', actorUserId, 'RESOLVED_PENDING_WARDEN_CLOSE', id]
        );
      }

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'STUDENT_APPROVE', decision: approvalDecision });
    }

    if (payload.action === 'WARDEN_CLOSE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'WARDEN') {
        return res.status(403).json({ message: 'Only the warden can close a complaint' });
      }

      const currentComplaint = await query('SELECT TOP 1 status, studentApprovalStatus, caretakerApprovalStatus FROM Maintenance WHERE id = ?', [id]);
      const currentStatus = String(currentComplaint?.[0]?.status || '').toUpperCase();
      const studentStatus = String(currentComplaint?.[0]?.studentApprovalStatus || '').toUpperCase();
      const caretakerStatus = String(currentComplaint?.[0]?.caretakerApprovalStatus || '').toUpperCase();
      if (currentStatus !== 'RESOLVED_PENDING_WARDEN_CLOSE' || studentStatus !== 'APPROVED' || caretakerStatus !== 'APPROVED') {
        return res.status(400).json({ message: 'Complaint is not ready for warden close' });
      }

      await query(
        `UPDATE Maintenance
         SET status = ?, closedById = ?, closedDate = GETDATE()
         WHERE id = ?`,
        ['CLOSED', actorUserId, id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'WARDEN_CLOSE' });
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
              m.caretakerApprovalStatus, m.caretakerApprovedById, m.caretakerApprovedDate,
             s.name AS studentName,
              s.email AS studentEmail,
             st.name AS staffName,
             ab.name AS assignedByName,
             rb.name AS resolvedByName,
              cap.name AS caretakerApprovedByName,
             sap.name AS studentApprovedByName,
             r.roomNumber
      FROM Maintenance m
      LEFT JOIN Students s ON m.studentId = s.id
      LEFT JOIN Users st ON m.staffId = st.id OR m.assignedTo = st.id
      LEFT JOIN Users ab ON m.assignedById = ab.id
      LEFT JOIN Users rb ON m.resolvedById = rb.id
            LEFT JOIN Users cap ON m.caretakerApprovedById = cap.id
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
    const actorUserId = toNullableInt(payload.actorUserId);
    const actorUser = await getUserRoleById(actorUserId);
    const linkedRoom = roomId ? await getRoomById(roomId) : null;
    const roomName = payload.room || linkedRoom?.roomNumber || '';

    if (payload.action === 'ASSIGN') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'WARDEN') {
        return res.status(403).json({ message: 'Only the warden can assign complaints' });
      }

      if (staffId) {
        const targetStaff = await getUserRoleById(staffId);
        if (!targetStaff || String(targetStaff.role || '').toUpperCase() !== 'CARETAKER') {
          return res.status(400).json({ message: 'Complaints can only be assigned to caretakers' });
        }
      }

      await query(
        `UPDATE Maintenance
         SET room = ?, roomId = ?, staffId = ?, assignedTo = ?, assignedById = ?, assignedDate = GETDATE(),
             status = ?, studentApprovalStatus = ?, caretakerApprovalStatus = ?,
             caretakerApprovedById = NULL, caretakerApprovedDate = NULL,
             studentApprovedById = NULL, studentApprovedDate = NULL,
             resolvedById = NULL, resolvedDate = NULL,
             closedById = NULL, closedDate = NULL
         WHERE id = ?`,
        [roomName, roomId, staffId, staffId, actorUserId, 'ASSIGNED', 'PENDING', 'PENDING', id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'ASSIGN' });
    }

    if (payload.action === 'RESOLVE' || payload.action === 'CARETAKER_APPROVE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'CARETAKER') {
        return res.status(403).json({ message: 'Only the assigned caretaker can mark a complaint resolved' });
      }

      const ownership = await query('SELECT TOP 1 staffId, assignedTo, status FROM Maintenance WHERE id = ?', [id]);
      const assignedStaffId = toNullableInt(ownership?.[0]?.staffId ?? ownership?.[0]?.assignedTo);
      const currentStatus = String(ownership?.[0]?.status || '').toUpperCase();
      if (!assignedStaffId || assignedStaffId !== actorUserId) {
        return res.status(403).json({ message: 'Only the assigned caretaker can approve resolution' });
      }
      if (currentStatus !== 'ASSIGNED') {
        return res.status(400).json({ message: 'Complaint is not in an assignable state for caretaker approval' });
      }

      await query(
        `UPDATE Maintenance
         SET status = ?, resolvedById = ?, resolvedDate = GETDATE(),
             caretakerApprovalStatus = ?, caretakerApprovedById = ?, caretakerApprovedDate = GETDATE()
         WHERE id = ?`,
        ['RESOLVED_PENDING_APPROVAL', actorUserId || staffId, 'APPROVED', actorUserId, id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'RESOLVE' });
    }

    if (payload.action === 'STUDENT_APPROVE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'STUDENT') {
        return res.status(403).json({ message: 'Only the student can approve or reject a complaint resolution' });
      }

      const approvalDecision = String(payload.decision || 'APPROVED').toUpperCase();
      if (approvalDecision === 'REJECTED') {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(),
               caretakerApprovalStatus = ?, caretakerApprovedById = NULL, caretakerApprovedDate = NULL,
               resolvedById = NULL, resolvedDate = NULL,
               status = ?
           WHERE id = ?`,
          ['REJECTED', actorUserId, 'PENDING', 'ASSIGNED', id]
        );
      } else {
        await query(
          `UPDATE Maintenance
           SET studentApprovalStatus = ?, studentApprovedById = ?, studentApprovedDate = GETDATE(), status = ?, closedById = NULL, closedDate = NULL
           WHERE id = ?`,
          ['APPROVED', actorUserId, 'RESOLVED_PENDING_WARDEN_CLOSE', id]
        );
      }

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'STUDENT_APPROVE', decision: approvalDecision });
    }

    if (payload.action === 'WARDEN_CLOSE') {
      if (!actorUser || String(actorUser.role || '').toUpperCase() !== 'WARDEN') {
        return res.status(403).json({ message: 'Only the warden can close a complaint' });
      }

      const currentComplaint = await query('SELECT TOP 1 status, studentApprovalStatus, caretakerApprovalStatus FROM Maintenance WHERE id = ?', [id]);
      const currentStatus = String(currentComplaint?.[0]?.status || '').toUpperCase();
      const studentStatus = String(currentComplaint?.[0]?.studentApprovalStatus || '').toUpperCase();
      const caretakerStatus = String(currentComplaint?.[0]?.caretakerApprovalStatus || '').toUpperCase();
      if (currentStatus !== 'RESOLVED_PENDING_WARDEN_CLOSE' || studentStatus !== 'APPROVED' || caretakerStatus !== 'APPROVED') {
        return res.status(400).json({ message: 'Complaint is not ready for warden close' });
      }

      await query(
        `UPDATE Maintenance
         SET status = ?, closedById = ?, closedDate = GETDATE()
         WHERE id = ?`,
        ['CLOSED', actorUserId, id]
      );

      const updated = await query('SELECT * FROM Maintenance WHERE id = ?', [id]);
      return res.json(updated && updated[0] ? updated[0] : { id, action: 'WARDEN_CLOSE' });
    }

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
    const result = await query(`
      SELECT p.*, s.name AS studentName, s.registrationNumber
      FROM Payments p
      LEFT JOIN Students s ON p.studentId = s.id
      ORDER BY p.paymentDate DESC
    `);
    res.json((result || []).map((row) => ({
      ...row,
      paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    })));
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
    res.status(201).json({ ...payload, paymentDate, created_at: paymentDate });
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

    let currentBalance = 0;
    if (student.userId) {
      const userBalanceRows = await query('SELECT TOP 1 balance FROM Users WHERE id = ?', [student.userId]);
      currentBalance = Number(userBalanceRows?.[0]?.balance || 0);
    } else {
      const userBalanceRows = await query('SELECT TOP 1 balance FROM Users WHERE email = ?', [student.email]);
      currentBalance = Number(userBalanceRows?.[0]?.balance || 0);
    }

    const allocation = await getActiveAllocationForStudent(student.id);
    if (!allocation) {
      return res.json({
        studentId: student.id,
        studentName: student.name,
        hasActiveAllocation: false,
        currentBalance,
        notifyRent: false,
        canPayNow: false,
        canRequestRoomChange: true,
        daysUntilRoomChangeAllowed: 0,
        roomChangeEligibleAt: null,
        daysUsed: 0,
        daysUntilPaymentDue: 0,
        nextPaymentDueAt: null,
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
    
    // Calculate nextPaymentDueAt using SQL for reliable date arithmetic
    const dueDateRows = await query(
      'SELECT DATEADD(day, ?, a.checkInDate) AS nextPaymentDueAt FROM Allocations a WHERE a.id = ?',
      [nextPayDayThreshold, allocation.id]
    );
    const nextPaymentDueAt = dueDateRows?.[0]?.nextPaymentDueAt || new Date();

    const roomChange = await getRoomChangeEligibility(student.id, allocation);

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
      bedId: allocation.bedId || null,
      bedNumber: allocation.bedNumber || null,
      monthlyRent: Number(allocation.rentalCost || 0),
      currentBalance,
      daysUsed,
      notifyRent: daysUsed >= 25,
      canPayNow: daysUsed >= nextPayDayThreshold,
      daysUntilPaymentDue: Math.max(0, nextPayDayThreshold - daysUsed),
      nextPaymentDueAt,
      canRequestRoomChange: roomChange.canRequestRoomChange,
      daysUntilRoomChangeAllowed: roomChange.daysUntilRoomChangeAllowed,
      roomChangeEligibleAt: roomChange.roomChangeEligibleAt,
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
    const method = String(payload.method || 'BKASH').toUpperCase() === 'NAGAD' ? 'NAGAD' : 'BKASH';
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

         DECLARE @payerUserId INT;
         DECLARE @adminUserId INT;

         SELECT TOP 1 @payerUserId = userId FROM Students WHERE id = ?;
         SELECT TOP 1 @adminUserId = id FROM Users WHERE role = 'ADMIN' ORDER BY id ASC;

         IF @payerUserId IS NULL OR @adminUserId IS NULL
         BEGIN
           RAISERROR('Payer or admin account not found for transfer.', 16, 1);
         END

         IF (SELECT balance FROM Users WHERE id = @payerUserId) < ?
         BEGIN
           RAISERROR('Insufficient balance to complete rent payment.', 16, 1);
         END

         UPDATE Users SET balance = balance - ? WHERE id = @payerUserId;
         UPDATE Users SET balance = balance + ? WHERE id = @adminUserId;

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
        amount,
        amount,
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
    const row = result[0];
    res.json({
      ...row,
      paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    });
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
    res.status(201).json({ ...payload, paymentDate, created_at: paymentDate });
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
    const result = await query(`
      SELECT u.id, u.name, u.email, u.role, u.hostelId, u.balance,
             sp.phone, sp.employmentStatus, sp.[shift] AS shiftName, sp.specialty, sp.joinedDate, sp.salary,
             DATEDIFF(day, ISNULL(sp.joinedDate, GETDATE()), GETDATE()) AS workedDays,
             CASE WHEN EXISTS (
               SELECT 1 FROM StaffPayments pay
               WHERE pay.staffUserId = u.id
                 AND pay.cycleMonth = MONTH(GETDATE())
                 AND pay.cycleYear = YEAR(GETDATE())
                 AND pay.status = 'SUCCESS'
             ) THEN 1 ELSE 0 END AS currentCyclePaid
      FROM Users u
      INNER JOIN StaffProfiles sp ON sp.userId = u.id
      WHERE u.role IN ('WARDEN', 'CARETAKER')
    `);
    const rows = (result || []).map(normalizeStaffProfileRow).map((row) => {
      const workedDays = Math.max(0, Number(row.workedDays || 0));
      const isActive = String(row.employmentStatus || '').toUpperCase() === 'ACTIVE';
      return {
        ...row,
        workedDays,
        currentCyclePaid: Number(row.currentCyclePaid || 0) === 1,
        isSalaryDue: isActive && workedDays >= 30 && Number(row.currentCyclePaid || 0) !== 1,
        balance: Number(row.balance || 0),
      };
    });
    res.json(rows);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query(`
            SELECT u.id, u.name, u.email, u.role, u.hostelId, u.balance,
              sp.phone, sp.employmentStatus, sp.[shift] AS shiftName, sp.specialty, sp.joinedDate, sp.salary,
              DATEDIFF(day, ISNULL(sp.joinedDate, GETDATE()), GETDATE()) AS workedDays,
              CASE WHEN EXISTS (
           SELECT 1 FROM StaffPayments pay
           WHERE pay.staffUserId = u.id
             AND pay.cycleMonth = MONTH(GETDATE())
             AND pay.cycleYear = YEAR(GETDATE())
             AND pay.status = 'SUCCESS'
              ) THEN 1 ELSE 0 END AS currentCyclePaid
      FROM Users u
      INNER JOIN StaffProfiles sp ON sp.userId = u.id
      WHERE u.id = ?
    `, [id]);
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    const row = normalizeStaffProfileRow(result[0]);
    const workedDays = Math.max(0, Number(row.workedDays || 0));
    const isActive = String(row.employmentStatus || '').toUpperCase() === 'ACTIVE';
    res.json({
      ...row,
      workedDays,
      currentCyclePaid: Number(row.currentCyclePaid || 0) === 1,
      isSalaryDue: isActive && workedDays >= 30 && Number(row.currentCyclePaid || 0) !== 1,
      balance: Number(row.balance || 0),
    });
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
    const employmentStatus = payload.employmentStatus === 'INACTIVE' || payload.employmentStatus === 'ON_LEAVE'
      ? payload.employmentStatus
      : 'ACTIVE';
    const shift = payload.shift === 'NIGHT' || payload.shift === 'FLEX' ? payload.shift : 'DAY';
    const specialty = payload.specialty || null;
    const phone = payload.phone || null;
    const joinedDate = payload.joinedDate || null;
    const salary = resolveStaffSalary(role);

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

    await query('BEGIN TRANSACTION');
    try {
      await query(
        'INSERT INTO Users (name, email, password, role, hostelId, balance) VALUES (?, ?, ?, ?, ?, ?)',
        [payload.name, payload.email, payload.password || 'password', role, hostelId, getInitialBalanceByRole(role)]
      );

      const insertedUsers = await query('SELECT TOP 1 id FROM Users WHERE email = ? ORDER BY id DESC', [payload.email]);
      const linkedUserId = insertedUsers?.[0]?.id || null;
      if (!linkedUserId) {
        throw new Error('Unable to create linked staff user');
      }

      await query(
        'INSERT INTO StaffProfiles (userId, phone, employmentStatus, [shift], specialty, joinedDate, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [linkedUserId, phone, employmentStatus, shift, specialty, joinedDate, salary]
      );
      await query('COMMIT TRANSACTION');
    } catch (createErr) {
      await query('ROLLBACK TRANSACTION');
      throw createErr;
    }

    res.status(201).json({ name: payload.name, email: payload.email, role, hostelId, phone, employmentStatus, shift, specialty, joinedDate, salary: resolveStaffSalary(role) });
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
    const employmentStatus = payload.employmentStatus === 'INACTIVE' || payload.employmentStatus === 'ON_LEAVE'
      ? payload.employmentStatus
      : 'ACTIVE';
    const shift = payload.shift === 'NIGHT' || payload.shift === 'FLEX' ? payload.shift : 'DAY';
    const specialty = payload.specialty || null;
    const phone = payload.phone || null;
    const joinedDate = payload.joinedDate || null;
    const salary = resolveStaffSalary(role);

    const hostel = await query('SELECT TOP 1 id FROM Hostels WHERE id = ?', [hostelId]);
    if (!hostel || hostel.length === 0) {
      return res.status(400).json({ message: 'Invalid hostel id' });
    }

    await query(
      'UPDATE Users SET name = ?, email = ?, role = ?, hostelId = ? WHERE id = ?',
      [payload.name, payload.email, role, hostelId, id]
    );

    const profileRows = await query('SELECT TOP 1 id FROM StaffProfiles WHERE userId = ?', [id]);
    if (!profileRows || profileRows.length === 0) {
      await query(
        'INSERT INTO StaffProfiles (userId, phone, employmentStatus, [shift], specialty, joinedDate, salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, phone, employmentStatus, shift, specialty, joinedDate, salary]
      );
    } else {
      await query(
        'UPDATE StaffProfiles SET phone = ?, employmentStatus = ?, [shift] = ?, specialty = ?, joinedDate = ?, salary = ? WHERE userId = ?',
        [phone, employmentStatus, shift, specialty, joinedDate, salary, id]
      );
    }

    res.json({ ...payload, id, role, hostelId, phone, employmentStatus, shift, specialty, joinedDate, salary: resolveStaffSalary(role) });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM StaffProfiles WHERE userId = ?', [id]);
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

app.get('/api/users/balance', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const rows = await query('SELECT TOP 1 id, name, email, role, balance FROM Users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, balance: Number(user.balance || 0) });
  } catch (err) {
    console.error('Get user balance error:', err);
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
      const account = await query('SELECT TOP 1 role FROM Users WHERE LOWER(email) = LOWER(?)', [studentEmail]);
      if (account && account.length > 0 && String(account[0].role || '').toUpperCase() !== 'STUDENT') {
        return res.status(403).json({ message: 'Only students can request rooms' });
      }

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
    const reservedCount = await getReservedSeatCountForRoom(roomId);
    if ((activeCount + reservedCount) >= Number(room[0].capacity || 0)) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    const activeAllocation = await getActiveAllocationForStudent(resolvedStudentId);
    if (activeAllocation && Number(activeAllocation.roomId) === Number(roomId)) {
      return res.status(400).json({ message: 'You are already allocated to this room' });
    }

    // Check if student already has a pending or approved request for this room
    const existingRequest = await query(
      "SELECT * FROM RoomRequests WHERE studentId = ? AND roomId = ? AND status IN ('PENDING', 'APPROVED', 'APPROVED_WAITING_SHIFT')",
      [resolvedStudentId, roomId]
    );

    if (existingRequest && existingRequest.length > 0) {
      return res.status(400).json({ message: 'You have already requested this room' });
    }

    const activeReservation = await query(
      "SELECT TOP 1 id FROM RoomRequests WHERE studentId = ? AND status IN ('PENDING', 'APPROVED_WAITING_SHIFT') ORDER BY id DESC",
      [resolvedStudentId]
    );
    if (activeReservation && activeReservation.length > 0) {
      return res.status(400).json({ message: 'You already have an active room reservation request' });
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
      return res.json({ message: 'Approved successfully', status: 'APPROVED' });
    }
    if (!['PENDING', 'APPROVED_WAITING_SHIFT'].includes(currentRequest.status)) {
      return res.status(400).json({ message: 'Only pending or waiting-shift requests can be approved' });
    }

    const activeAllocation = await getActiveAllocationForStudent(currentRequest.studentId);
    if (activeAllocation && Number(activeAllocation.roomId) === Number(currentRequest.roomId)) {
      await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['APPROVED', requestId]);
      await query('DELETE FROM RoomRequests WHERE studentId = ? AND id <> ?', [currentRequest.studentId, requestId]);
      return res.json({ message: 'Approved successfully', status: 'APPROVED', bedId: activeAllocation.bedId || null });
    }

    if (activeAllocation) {
      const eligibility = await getRoomChangeEligibility(currentRequest.studentId, activeAllocation);
      if (!eligibility.canRequestRoomChange) {
        await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['APPROVED_WAITING_SHIFT', requestId]);
        await syncRoomStatus(currentRequest.roomId);
        return res.status(202).json({
          message: `Approved and reserved. Student can shift after ${ROOM_CHANGE_MIN_DAYS} days in current room`,
          status: 'APPROVED_WAITING_SHIFT',
          daysUsed: eligibility.daysUsed,
          daysUntilRoomChangeAllowed: eligibility.daysUntilRoomChangeAllowed,
          roomChangeEligibleAt: eligibility.roomChangeEligibleAt,
        });
      }
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
      const reservedCount = await getReservedSeatCountForRoom(currentRequest.roomId, requestId);
      if ((activeCount + reservedCount) >= Number(room[0].capacity || 0)) {
        throw new Error('Room is at full capacity');
      }

      await ensureBedsForRoom(currentRequest.roomId, room[0].capacity);
      const bed = await getAvailableBed(currentRequest.roomId, Number(room[0].capacity || 0));
      const bedId = getRowId(bed);
      if (!bedId) {
        throw new Error('Room is at full capacity');
      }

      if (activeAllocation) {
        await query(
          'UPDATE Allocations SET status = ?, checkOutDate = GETDATE() WHERE id = ? AND status = ?',
          ['COMPLETED', activeAllocation.id, 'ACTIVE']
        );
        if (activeAllocation.bedId) {
          await closeActiveStayRecord(currentRequest.studentId, activeAllocation.bedId);
          await query('UPDATE Beds SET status = ? WHERE id = ?', ['AVAILABLE', activeAllocation.bedId]);
        }
        await syncRoomStatus(activeAllocation.roomId);
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
      const roomReservedCount = await getReservedSeatCountForRoom(currentRequest.roomId, requestId);
      const newStatus = (Number(activeBeds?.[0]?.count || 0) + roomReservedCount) >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
      await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, currentRequest.roomId]);

      await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['APPROVED', requestId]);
      await query('DELETE FROM RoomRequests WHERE studentId = ? AND id <> ?', [currentRequest.studentId, requestId]);
      await triggerOccupancySnapshot();
      await query('COMMIT TRANSACTION');

      res.json({ message: 'Approved successfully', status: 'APPROVED', bedId });
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
});

/* =========================
   ADMIN DISAPPROVE REQUEST
========================= */
app.put('/api/room-requests/:id/disapprove', async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const request = await query(
      'SELECT TOP 1 rr.id, rr.studentId, rr.roomId, rr.status FROM RoomRequests rr WHERE rr.id = ?',
      [requestId]
    );

    if (!request || request.length === 0) {
      return res.status(404).json({ message: 'Room request not found' });
    }

    const currentRequest = request[0];
    const currentStatus = String(currentRequest.status || '').toUpperCase();

    if (currentStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Approved request cannot be disapproved' });
    }

    if (currentStatus === 'DISAPPROVED') {
      return res.json({ message: 'Already disapproved', status: 'DISAPPROVED' });
    }

    if (!['PENDING', 'APPROVED_WAITING_SHIFT'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Only pending or waiting-shift requests can be disapproved' });
    }

    await query('UPDATE RoomRequests SET status = ? WHERE id = ?', ['DISAPPROVED', requestId]);
    await syncRoomStatus(currentRequest.roomId);

    return res.json({ message: 'Room request disapproved successfully', status: 'DISAPPROVED' });
  } catch (err) {
    console.error('Disapprove room request error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/* =========================
   CANCEL/DELETE ROOM REQUEST
========================= */
app.delete('/api/room-requests/:id', async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    
    const request = await query(
      'SELECT TOP 1 rr.id, rr.studentId, rr.roomId, rr.status FROM RoomRequests rr WHERE rr.id = ?',
      [requestId]
    );

    if (!request || request.length === 0) {
      return res.status(404).json({ message: 'Room request not found' });
    }

    const currentRequest = request[0];

    // Only allow canceling PENDING requests
    if (currentRequest.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    // Delete the request
    await query('DELETE FROM RoomRequests WHERE id = ?', [requestId]);

    // Update room status after cancellation
    await syncRoomStatus(currentRequest.roomId);

    res.json({ message: 'Room request cancelled successfully' });
  } catch (err) {
    console.error('Cancel room request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/reports/occupancy', async (req, res) => {
  try {
    await recordOccupancySnapshot();

    // Return latest snapshot per room so report always contains all rooms.
    const result = await query(`
      WITH LatestPerRoom AS (
        SELECT
          r.id,
          r.roomId,
          r.occupiedBeds,
          r.totalBeds,
          ROW_NUMBER() OVER (
            PARTITION BY r.roomId
            ORDER BY r.reportDate DESC, r.id DESC
          ) AS rn
        FROM dbo.OccupancyReport r
      ),
      RoomActivity AS (
        SELECT
          a.roomId,
          MAX(a.checkInDate) AS lastAllocationAt
        FROM dbo.Allocations a
        GROUP BY a.roomId
      )
      SELECT
        l.id,
        l.roomId,
        rm.roomNumber,
        l.totalBeds AS capacity,
        l.occupiedBeds AS occupied,
        l.totalBeds - l.occupiedBeds AS available,
        CASE
          WHEN ra.lastAllocationAt IS NULL THEN NULL
          ELSE CONVERT(VARCHAR(33), TODATETIMEOFFSET(ra.lastAllocationAt, DATEPART(TZOFFSET, SYSDATETIMEOFFSET())), 127)
        END AS lastAllocationAt
      FROM LatestPerRoom l
      LEFT JOIN Rooms rm ON rm.id = l.roomId
      LEFT JOIN RoomActivity ra ON ra.roomId = l.roomId
      WHERE l.rn = 1
      ORDER BY rm.roomNumber ASC
    `);
    res.json(result);
  } catch (err) {
    console.error('Get occupancy report error:', err);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// Helper function to record occupancy snapshot
async function recordOccupancySnapshot() {
  try {
    await query(`
      INSERT INTO dbo.OccupancyReport (roomId, occupiedBeds, totalBeds, reportDate)
      SELECT
        r.id,
        COUNT(CASE WHEN b.status = 'OCCUPIED' THEN 1 END) AS occupiedBeds,
        r.capacity AS totalBeds,
        GETDATE()
      FROM Rooms r
      LEFT JOIN Beds b ON b.roomId = r.id
      GROUP BY r.id, r.capacity
    `);
  } catch (err) {
    console.error('Error recording occupancy snapshot:', err);
  }
}

// Record occupancy on room checkout/allocation changes
async function triggerOccupancySnapshot() {
  // This will be called after finalize shift or allocation changes
  await recordOccupancySnapshot();
}

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
              'INSERT INTO Users (name, email, password, role, hostelId, balance) VALUES (?, ?, ?, ?, ?, ?)',
              [studentData.name, studentEmail, studentData.password, 'STUDENT', null, getInitialBalanceByRole('STUDENT')]
            );
          }

          const linkedUserRows = await query('SELECT TOP 1 id FROM Users WHERE email = ? AND role = ? ORDER BY id DESC', [studentEmail, 'STUDENT']);
          const linkedUserId = linkedUserRows?.[0]?.id || null;
          if (!linkedUserId) {
            throw new Error('Unable to create linked student user');
          }

          const registrationNumber = await getNextRegistrationNumber();

          await query(
            'INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              studentData.name,
              studentEmail,
              studentData.phone || '',
              registrationNumber,
              studentData.department || '',
              toIntOrDefault(studentData.yearOfStudy, 1),
              'ACTIVE',
              studentData.password,
              linkedUserId,
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
    const reservedCount = await getReservedSeatCountForRoom(roomId);
    if ((activeCount + reservedCount) >= Number(room[0].capacity || 0)) {
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
    const refreshedReservedCount = await getReservedSeatCountForRoom(roomId);
    const newStatus = (Number(activeBeds?.[0]?.count || 0) + refreshedReservedCount) >= room[0].capacity ? 'OCCUPIED' : 'AVAILABLE';
    await query('UPDATE Rooms SET status = ? WHERE id = ?', [newStatus, roomId]);
    await triggerOccupancySnapshot();
    
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
    await triggerOccupancySnapshot();
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
    await triggerOccupancySnapshot();
    
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

    // Outstanding dues by student (using Invoices table)
    const duesQuery = `
      SELECT
        s.name,
        s.email,
        a.roomId,
        COUNT(*) as pending_invoices,
        SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END) as total_dues
      FROM Invoices i
      JOIN Students s ON i.studentId = s.id
      LEFT JOIN Allocations a ON s.id = a.studentId AND a.status = 'ACTIVE'
      WHERE i.status = 'PENDING'
      GROUP BY s.id, s.name, s.email, a.roomId
      HAVING SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END) > 0
      ORDER BY total_dues DESC
    `;
    const duesResult = await query(duesQuery);

    // Payment method distribution (using 'method' column)
    const paymentMethodQuery = `
      SELECT
        method as paymentMethod,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Payments), 1) as percentage
      FROM Payments
      GROUP BY method
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
    // Department-wise distribution (using department instead of course)
    const departmentQuery = `
      SELECT
        department,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY count DESC
    `;
    const departmentResult = await query(departmentQuery);

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

    // Status distribution
    const statusQuery = `
      SELECT
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Students), 1) as percentage
      FROM Students
      GROUP BY status
    `;
    const statusResult = await query(statusQuery);

    // Students by registration year (derived from registration number if available)
    const registrationYearQuery = `
      SELECT
        CASE
          WHEN PATINDEX('%[0-9]%', registrationNumber) > 0
          THEN CAST(TRY_CAST(SUBSTRING(registrationNumber, PATINDEX('%[0-9]%', registrationNumber), LEN(registrationNumber)) AS INT) AS NVARCHAR(20))
          ELSE 'Unknown'
        END as registration_year,
        COUNT(*) as count
      FROM Students
      WHERE registrationNumber IS NOT NULL AND registrationNumber != ''
      GROUP BY
        CASE
          WHEN PATINDEX('%[0-9]%', registrationNumber) > 0
          THEN CAST(TRY_CAST(SUBSTRING(registrationNumber, PATINDEX('%[0-9]%', registrationNumber), LEN(registrationNumber)) AS INT) AS NVARCHAR(20))
          ELSE 'Unknown'
        END
      ORDER BY TRY_CAST(registration_year AS INT) DESC
    `;
    const registrationYearResult = await query(registrationYearQuery);

    res.json({
      departmentDistribution: departmentResult,
      yearOfStudyDistribution: yearResult,
      statusDistribution: statusResult,
      registrationYearDistribution: registrationYearResult,
      totalStudents: departmentResult.reduce((sum, item) => sum + item.count, 0) || yearResult.reduce((sum, item) => sum + item.count, 0) || 0
    });
  } catch (err) {
    console.error('Student analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/analytics/maintenance', async (req, res) => {
  try {
    // Priority distribution
    const priorityQuery = `
      SELECT
        priority,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0) / (SELECT COUNT(*) FROM Maintenance), 1) as percentage
      FROM Maintenance
      GROUP BY priority
      ORDER BY count DESC
    `;
    const priorityResult = await query(priorityQuery);

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

    // Average resolution time by priority
    const resolutionTimeQuery = `
      SELECT
        priority,
        AVG(DATEDIFF(HOUR, reportedDate, resolvedDate)) as avg_resolution_hours,
        COUNT(*) as total_issues
      FROM Maintenance
      WHERE status = 'CLOSED' AND resolvedDate IS NOT NULL
      GROUP BY priority
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

    // Issues by room (top problematic rooms)
    const roomIssuesQuery = `
      SELECT
        r.roomNumber,
        COUNT(*) as issue_count,
        r.type as room_type
      FROM Maintenance m
      LEFT JOIN Rooms r ON m.roomId = r.id
      WHERE m.roomId IS NOT NULL
      GROUP BY r.id, r.roomNumber, r.type
      ORDER BY issue_count DESC
    `;
    const roomIssuesResult = await query(roomIssuesQuery);

    res.json({
      priorityDistribution: priorityResult,
      statusDistribution: statusResult,
      resolutionTimeByPriority: resolutionTimeResult,
      monthlyRequests: monthlyResult,
      roomIssues: roomIssuesResult,
      totalRequests: priorityResult.reduce((sum, item) => sum + item.count, 0),
      resolvedRequests: statusResult.find(item => item.status === 'CLOSED')?.count || 0
    });
  } catch (err) {
    console.error('Maintenance analytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Payment endpoints
app.post('/api/payments/initiate', async (req, res) => {
  try {
    const { invoiceId, studentId, amount, method = 'BKASH' } = req.body;

    console.log('🔵 [PAYMENT INITIATE] Received request:', { invoiceId, studentId, amount, method });

    if (!invoiceId || !studentId || !amount) {
      console.error('❌ [PAYMENT INITIATE] Missing required fields');
      return res.status(400).json({ message: 'invoiceId, studentId, and amount are required' });
    }

    // Validate invoice exists and belongs to student
    console.log('🔍 [PAYMENT INITIATE] Verifying invoice ownership...');
    const invoice = await query('SELECT * FROM Invoices WHERE id = ? AND studentId = ?', [invoiceId, studentId]);
    if (!invoice || invoice.length === 0) {
      console.error('❌ [PAYMENT INITIATE] Invoice not found:', { invoiceId, studentId });
      return res.status(404).json({ message: 'Invoice not found or does not belong to student' });
    }

    console.log('✅ [PAYMENT INITIATE] Invoice found:', invoice[0]);

    // Check if amount matches
    if (parseFloat(invoice[0].amount) !== parseFloat(amount)) {
      console.error('❌ [PAYMENT INITIATE] Amount mismatch:', { expected: invoice[0].amount, received: amount });
      return res.status(400).json({ message: 'Payment amount does not match invoice amount' });
    }

    // Check for existing pending payment
    console.log('🔍 [PAYMENT INITIATE] Checking for existing pending payment...');
    const existingPending = await query('SELECT * FROM Payments WHERE invoiceId = ? AND status = ?', [invoiceId, 'PENDING']);
    if (existingPending && existingPending.length > 0) {
      console.error('❌ [PAYMENT INITIATE] Payment already pending for this invoice');
      return res.status(400).json({ message: 'Payment already initiated for this invoice' });
    }

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 [PAYMENT INITIATE] Generated transaction ID:', transactionId);

    // Create payment record
    console.log('💾 [PAYMENT INITIATE] Creating payment record in database...');
    await query(
      'INSERT INTO Payments (invoiceId, studentId, amount, paymentDate, method, status, transaction_id, created_at) VALUES (?, ?, ?, GETDATE(), ?, ?, ?, GETDATE())',
      [invoiceId, studentId, amount, method, 'PENDING', transactionId]
    );

    console.log('✅ [PAYMENT INITIATE] Payment record created successfully');

    const returnUrl = `${BACKEND_BASE_URL}/api/payments/callback/redirect`;
    console.log('📤 [PAYMENT INITIATE] Generating redirect URL for provider:', method, 'callbackUrl:', returnUrl);

    let redirectUrl;
    try {
      redirectUrl = await getPaymentProviderRedirectUrl({ method, transactionId, amount, invoiceId, studentId, returnUrl });
      if (!redirectUrl) {
        throw new Error('Payment provider did not return a redirect URL');
      }
    } catch (providerError) {
      console.error('❌ [PAYMENT INITIATE] External provider integration failed:', providerError);
      // Demo-safe fallback for local testing without provider credentials.
      redirectUrl = `${FRONTEND_BASE_URL}/payment/process?transaction_id=${encodeURIComponent(transactionId)}&method=${encodeURIComponent(method)}&paymentType=STUDENT`;
      return res.json({
        transactionId,
        redirectUrl,
        amount,
        method,
        message: 'Payment initialized in demo mode (provider unavailable)',
      });
    }

    console.log('✅ [PAYMENT INITIATE] Success:', { transactionId, redirectUrl });

    res.json({
      transactionId,
      redirectUrl,
      amount,
      method,
      message: 'Payment initiated successfully'
    });
  } catch (err) {
    console.error('❌ [PAYMENT INITIATE] Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.all('/api/payments/callback/redirect', async (req, res) => {
  try {
    const payload = req.method === 'GET' ? req.query : req.body;
    const transactionId = payload.transaction_id || payload.transactionId || payload.invoiceNumber || payload.merchantInvoiceNumber;
    const rawStatus = (payload.status || payload.result || payload.paymentStatus || '').toString().toUpperCase();
    const reference = payload.reference || payload.paymentId || payload.tranId || payload.transaction_id || '';

    console.log('🔵 [PAYMENT REDIRECT CALLBACK] Received redirect callback:', { payload });

    if (!transactionId) {
      console.error('❌ [PAYMENT REDIRECT CALLBACK] Missing transaction_id');
      return res.status(400).send('transaction_id is required');
    }

    const payment = await query('SELECT * FROM Payments WHERE transaction_id = ?', [transactionId]);
    if (!payment || payment.length === 0) {
      console.error('❌ [PAYMENT REDIRECT CALLBACK] Payment not found:', transactionId);
      return res.status(404).send('Payment not found');
    }

    const existingPayment = payment[0];
    let newStatus = 'FAILED';
    if (rawStatus.includes('SUCCESS') || rawStatus.includes('PAID') || rawStatus.includes('COMPLETED') || rawStatus === '1' || rawStatus === 'OK') {
      newStatus = 'SUCCESS';
    } else if (rawStatus.includes('PENDING')) {
      newStatus = 'PENDING';
    }

    console.log('💾 [PAYMENT REDIRECT CALLBACK] Updating payment status:', { transactionId, newStatus, reference });
    if (newStatus === 'SUCCESS' && String(existingPayment.status || '').toUpperCase() === 'PENDING') {
      await query(
        `BEGIN TRY
           BEGIN TRAN;

           DECLARE @payerUserId INT;
           DECLARE @adminUserId INT;

           SELECT TOP 1 @payerUserId = userId FROM Students WHERE id = ?;
           SELECT TOP 1 @adminUserId = id FROM Users WHERE role = 'ADMIN' ORDER BY id ASC;

           IF @payerUserId IS NULL OR @adminUserId IS NULL
           BEGIN
             RAISERROR('Payer or admin account not found for transfer.', 16, 1);
           END

           IF (SELECT balance FROM Users WHERE id = @payerUserId) < ?
           BEGIN
             RAISERROR('Insufficient balance to complete payment.', 16, 1);
           END

           UPDATE Users SET balance = balance - ? WHERE id = @payerUserId;
           UPDATE Users SET balance = balance + ? WHERE id = @adminUserId;

           UPDATE Payments SET status = ?, reference = ? WHERE transaction_id = ?;

           IF ? IS NOT NULL
           BEGIN
             UPDATE Invoices SET status = ? WHERE id = ?;
           END

           COMMIT TRAN;
         END TRY
         BEGIN CATCH
           IF @@TRANCOUNT > 0
             ROLLBACK TRAN;

           DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
           RAISERROR(@Err, 16, 1);
         END CATCH`,
        [
          existingPayment.studentId,
          Number(existingPayment.amount || 0),
          Number(existingPayment.amount || 0),
          Number(existingPayment.amount || 0),
          'SUCCESS',
          reference || '',
          transactionId,
          existingPayment.invoiceId || null,
          'PAID',
          existingPayment.invoiceId || null,
        ]
      );
    } else {
      await query('UPDATE Payments SET status = ?, reference = ? WHERE transaction_id = ?', [newStatus, reference || '', transactionId]);
      if (newStatus === 'SUCCESS' && existingPayment.invoiceId) {
        await query('UPDATE Invoices SET status = ? WHERE id = ?', ['PAID', existingPayment.invoiceId]);
      }
    }

    const method = existingPayment?.method || 'BKASH';
    const redirectAfter = `${FRONTEND_BASE_URL}/payment/process?transaction_id=${encodeURIComponent(transactionId)}&method=${encodeURIComponent(method)}&paymentType=STUDENT`;
    return res.redirect(302, redirectAfter);
  } catch (err) {
    console.error('❌ [PAYMENT REDIRECT CALLBACK] Server error:', err);
    res.status(500).send('Internal server error');
  }
});

app.post('/api/payments/callback/success', async (req, res) => {
  try {
    const { transaction_id, reference, status } = req.body;

    console.log('🔵 [PAYMENT SUCCESS] Received callback:', { transaction_id, reference, status });

    if (!transaction_id) {
      console.error('❌ [PAYMENT SUCCESS] Missing transaction_id');
      return res.status(400).json({ message: 'transaction_id is required' });
    }

    // Find payment
    console.log('🔍 [PAYMENT SUCCESS] Looking for pending payment:', transaction_id);
    const payment = await query('SELECT * FROM Payments WHERE transaction_id = ? AND status = ?', [transaction_id, 'PENDING']);
    if (!payment || payment.length === 0) {
      console.error('❌ [PAYMENT SUCCESS] Payment not found or already processed:', transaction_id);
      return res.status(404).json({ message: 'Payment not found or already processed' });
    }

    console.log('✅ [PAYMENT SUCCESS] Payment found:', payment[0]);

    // Update payment + transfer student balance to admin balance atomically
    console.log('💾 [PAYMENT SUCCESS] Updating payment to SUCCESS status with wallet transfer...');
    const pendingPayment = payment[0];
    await query(
      `BEGIN TRY
         BEGIN TRAN;

         DECLARE @payerUserId INT;
         DECLARE @adminUserId INT;

         SELECT TOP 1 @payerUserId = userId FROM Students WHERE id = ?;
         SELECT TOP 1 @adminUserId = id FROM Users WHERE role = 'ADMIN' ORDER BY id ASC;

         IF @payerUserId IS NULL OR @adminUserId IS NULL
         BEGIN
           RAISERROR('Payer or admin account not found for transfer.', 16, 1);
         END

         IF (SELECT balance FROM Users WHERE id = @payerUserId) < ?
         BEGIN
           RAISERROR('Insufficient balance to complete payment.', 16, 1);
         END

         UPDATE Users SET balance = balance - ? WHERE id = @payerUserId;
         UPDATE Users SET balance = balance + ? WHERE id = @adminUserId;

         UPDATE Payments SET status = ?, reference = ? WHERE transaction_id = ?;

         IF ? IS NOT NULL
         BEGIN
           UPDATE Invoices SET status = ? WHERE id = ?;
         END

         COMMIT TRAN;
       END TRY
       BEGIN CATCH
         IF @@TRANCOUNT > 0
           ROLLBACK TRAN;

         DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
         RAISERROR(@Err, 16, 1);
       END CATCH`,
      [
        pendingPayment.studentId,
        Number(pendingPayment.amount || 0),
        Number(pendingPayment.amount || 0),
        Number(pendingPayment.amount || 0),
        'SUCCESS',
        reference || '',
        transaction_id,
        pendingPayment.invoiceId || null,
        'PAID',
        pendingPayment.invoiceId || null,
      ]
    );

    console.log('✅ [PAYMENT SUCCESS] Payment processed successfully:', transaction_id);

    res.json({ message: 'Payment processed successfully' });
  } catch (err) {
    console.error('❌ [PAYMENT SUCCESS] Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.post('/api/payments/callback/failure', async (req, res) => {
  try {
    const { transaction_id, reason } = req.body;

    console.log('🔵 [PAYMENT FAILURE] Received callback:', { transaction_id, reason });

    if (!transaction_id) {
      console.error('❌ [PAYMENT FAILURE] Missing transaction_id');
      return res.status(400).json({ message: 'transaction_id is required' });
    }

    // Find payment
    console.log('🔍 [PAYMENT FAILURE] Looking for pending payment:', transaction_id);
    const payment = await query('SELECT * FROM Payments WHERE transaction_id = ? AND status = ?', [transaction_id, 'PENDING']);
    if (!payment || payment.length === 0) {
      console.error('❌ [PAYMENT FAILURE] Payment not found or already processed:', transaction_id);
      return res.status(404).json({ message: 'Payment not found or already processed' });
    }

    console.log('✅ [PAYMENT FAILURE] Payment found:', payment[0]);

    // Update payment
    console.log('💾 [PAYMENT FAILURE] Updating payment to FAILED status...');
    await query('UPDATE Payments SET status = ? WHERE transaction_id = ?', ['FAILED', transaction_id]);

    console.log('✅ [PAYMENT FAILURE] Payment failure recorded:', { transaction_id, reason });

    res.json({ message: 'Payment failure recorded' });
  } catch (err) {
    console.error('❌ [PAYMENT FAILURE] Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.get('/api/payments/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const payment = await query('SELECT * FROM Payments WHERE transaction_id = ?', [transactionId]);
    if (!payment || payment.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const record = payment[0];
    res.json({
      transactionId: record.transaction_id,
      invoiceId: record.invoiceId,
      amount: record.amount,
      method: record.method,
      status: record.status,
      reference: record.reference || null,
      createdAt: record.created_at ? new Date(record.created_at).toISOString() : null,
    });
  } catch (err) {
    console.error('❌ [PAYMENT STATUS] Server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const { status, studentId } = req.query;
    let sql = `
      SELECT p.*, s.name as studentName, s.email as studentEmail, i.description as invoiceDescription
      FROM Payments p
      LEFT JOIN Students s ON p.studentId = s.id
      LEFT JOIN Invoices i ON p.invoiceId = i.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }

    if (studentId) {
      sql += status ? ' AND' : ' WHERE';
      sql += ' p.studentId = ?';
      params.push(studentId);
    }

    sql += ' ORDER BY p.created_at DESC';

    const result = await query(sql, params);
    res.json((result || []).map((row) => ({
      ...row,
      paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    })));
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/payments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query(`
      SELECT p.*, s.name as studentName, s.email as studentEmail, i.description as invoiceDescription
      FROM Payments p
      LEFT JOIN Students s ON p.studentId = s.id
      LEFT JOIN Invoices i ON p.invoiceId = i.id
      WHERE p.id = ?
    `, [id]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const row = result[0];
    res.json({
      ...row,
      paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
    });
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff-payments', async (req, res) => {
  try {
    const { staffUserId, status, cycleMonth, cycleYear } = req.query;
    let sql = `
      SELECT sp.*, staff.name AS staffName, staff.email AS staffEmail,
             initiator.name AS initiatedByName
      FROM StaffPayments sp
      INNER JOIN Users staff ON sp.staffUserId = staff.id
      LEFT JOIN Users initiator ON sp.initiatedByUserId = initiator.id
    `;
    const params = [];

    if (staffUserId) {
      sql += ' WHERE sp.staffUserId = ?';
      params.push(toIntOrDefault(staffUserId, 0));
    }

    if (status) {
      sql += params.length > 0 ? ' AND' : ' WHERE';
      sql += ' sp.status = ?';
      params.push(String(status).toUpperCase());
    }

    if (cycleMonth) {
      sql += params.length > 0 ? ' AND' : ' WHERE';
      sql += ' sp.cycleMonth = ?';
      params.push(toIntOrDefault(cycleMonth, 0));
    }

    if (cycleYear) {
      sql += params.length > 0 ? ' AND' : ' WHERE';
      sql += ' sp.cycleYear = ?';
      params.push(toIntOrDefault(cycleYear, 0));
    }

    sql += ' ORDER BY sp.created_at DESC';
    const result = await query(sql, params);
    res.json(result);
  } catch (err) {
    console.error('Get staff payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff-payments/me', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const staffRows = await query("SELECT TOP 1 id, role FROM Users WHERE email = ?", [email]);
    if (!staffRows || staffRows.length === 0) {
      return res.status(404).json({ message: 'Staff account not found' });
    }

    if (!['WARDEN', 'CARETAKER'].includes(staffRows[0].role)) {
      return res.status(400).json({ message: 'User is not a staff account' });
    }

    const result = await query(`
      SELECT sp.*, staff.name AS staffName, staff.email AS staffEmail,
             initiator.name AS initiatedByName
      FROM StaffPayments sp
      INNER JOIN Users staff ON sp.staffUserId = staff.id
      LEFT JOIN Users initiator ON sp.initiatedByUserId = initiator.id
      WHERE sp.staffUserId = ?
      ORDER BY sp.created_at DESC
    `, [staffRows[0].id]);

    res.json(result);
  } catch (err) {
    console.error('Get my staff payments error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/staff-salary-prompts', async (req, res) => {
  try {
    const { email } = req.query;
    let sql = `
      SELECT p.*, staff.name AS staffName, staff.email AS staffEmail, resolver.name AS resolvedByName
      FROM StaffSalaryPrompts p
      INNER JOIN Users staff ON staff.id = p.staffUserId
      LEFT JOIN Users resolver ON resolver.id = p.resolvedByUserId
    `;
    const params = [];

    if (email) {
      const rows = await query('SELECT TOP 1 id, role FROM Users WHERE email = ?', [email]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = rows[0];
      if (user.role === 'WARDEN' || user.role === 'CARETAKER') {
        sql += ' WHERE p.staffUserId = ?';
        params.push(user.id);
      }
    }

    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json(result || []);
  } catch (err) {
    console.error('Get staff salary prompts error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/staff-salary-prompts', async (req, res) => {
  try {
    const { staffEmail, message } = req.body || {};
    if (!staffEmail) {
      return res.status(400).json({ message: 'staffEmail is required' });
    }

    const staffRows = await query('SELECT TOP 1 id, role FROM Users WHERE email = ?', [staffEmail]);
    if (!staffRows || staffRows.length === 0) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const staff = staffRows[0];
    if (!['WARDEN', 'CARETAKER'].includes(staff.role)) {
      return res.status(400).json({ message: 'User is not staff' });
    }

    const { month, year } = getCurrentCycle();
    const alreadyPaidRows = await query(
      `SELECT TOP 1 id FROM StaffPayments WHERE staffUserId = ? AND cycleMonth = ? AND cycleYear = ? AND status = 'SUCCESS'`,
      [staff.id, month, year]
    );
    if (alreadyPaidRows && alreadyPaidRows.length > 0) {
      return res.status(400).json({ message: 'Salary already paid for current cycle' });
    }

    const existingPrompt = await query(
      `SELECT TOP 1 id FROM StaffSalaryPrompts WHERE staffUserId = ? AND cycleMonth = ? AND cycleYear = ? AND status = 'PENDING'`,
      [staff.id, month, year]
    );
    if (existingPrompt && existingPrompt.length > 0) {
      return res.status(400).json({ message: 'Prompt already sent for current cycle' });
    }

    await query(
      `INSERT INTO StaffSalaryPrompts (staffUserId, cycleMonth, cycleYear, message, status, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', GETDATE())`,
      [staff.id, month, year, message || 'Salary pending for this month.']
    );

    res.status(201).json({ message: 'Prompt sent to admin successfully' });
  } catch (err) {
    console.error('Create staff salary prompt error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.post('/api/staff-salary-prompts/:id/resolve', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const resolvedByEmail = req.body?.resolvedByEmail;
    if (!id || !resolvedByEmail) {
      return res.status(400).json({ message: 'id and resolvedByEmail are required' });
    }

    const resolverRows = await query("SELECT TOP 1 id, role FROM Users WHERE email = ?", [resolvedByEmail]);
    if (!resolverRows || resolverRows.length === 0 || resolverRows[0].role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can resolve prompts' });
    }

    await query(
      "UPDATE StaffSalaryPrompts SET status = 'RESOLVED', resolvedByUserId = ?, resolved_at = GETDATE() WHERE id = ?",
      [resolverRows[0].id, id]
    );

    res.json({ message: 'Prompt resolved' });
  } catch (err) {
    console.error('Resolve staff salary prompt error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.post('/api/staff-payments/initiate', async (req, res) => {
  try {
    const {
      staffUserId,
      cycleMonth,
      cycleYear,
      method = 'BKASH',
      initiatedByUserId,
      notes = '',
    } = req.body || {};

    const resolvedStaffUserId = toIntOrDefault(staffUserId, 0);
    const resolvedCycleMonth = toIntOrDefault(cycleMonth, 0);
    const resolvedCycleYear = toIntOrDefault(cycleYear, 0);
    let resolvedInitiatedBy = toNullableInt(initiatedByUserId);
    const resolvedMethod = String(method || 'BKASH').toUpperCase() === 'NAGAD' ? 'NAGAD' : 'BKASH';

    if (!resolvedStaffUserId || !resolvedCycleMonth || !resolvedCycleYear) {
      return res.status(400).json({ message: 'staffUserId, cycleMonth, and cycleYear are required' });
    }
    if (resolvedCycleMonth < 1 || resolvedCycleMonth > 12) {
      return res.status(400).json({ message: 'cycleMonth must be between 1 and 12' });
    }

    const staffRows = await query('SELECT TOP 1 id, role FROM Users WHERE id = ?', [resolvedStaffUserId]);
    if (!staffRows || staffRows.length === 0) {
      return res.status(404).json({ message: 'Staff user not found' });
    }
    if (!['WARDEN', 'CARETAKER'].includes(staffRows[0].role)) {
      return res.status(400).json({ message: 'Target user is not staff' });
    }

    const salaryRows = await query('SELECT TOP 1 salary FROM StaffProfiles WHERE userId = ?', [resolvedStaffUserId]);
    const policyAmount = resolveStaffSalary(staffRows[0].role, salaryRows?.[0]?.salary);
    if (!policyAmount) {
      return res.status(400).json({ message: 'Salary is not configured for this staff member' });
    }

    if (!resolvedInitiatedBy) {
      const adminRows = await query("SELECT TOP 1 id FROM Users WHERE role = 'ADMIN' ORDER BY id ASC");
      resolvedInitiatedBy = adminRows?.[0]?.id || null;
    }

    if (!resolvedInitiatedBy) {
      return res.status(400).json({ message: 'Admin user not found for payment initiation' });
    }

    const initiatorRows = await query('SELECT TOP 1 id, role FROM Users WHERE id = ?', [resolvedInitiatedBy]);
    if (!initiatorRows || initiatorRows.length === 0 || initiatorRows[0].role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admin can initiate staff salary payments' });
    }

    const workedRows = await query('SELECT TOP 1 DATEDIFF(day, ISNULL(joinedDate, GETDATE()), GETDATE()) AS workedDays FROM StaffProfiles WHERE userId = ?', [resolvedStaffUserId]);
    const workedDays = Math.max(0, Number(workedRows?.[0]?.workedDays || 0));
    if (workedDays < 30) {
      return res.status(400).json({ message: 'Staff has not completed one month yet' });
    }

    const resolvedAmount = Number(policyAmount || 0);
    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return res.status(400).json({ message: 'Salary policy produced an invalid amount' });
    }

    const transactionId = `STAFFPAY_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await query(
      `BEGIN TRY
         BEGIN TRAN;

         IF EXISTS (
           SELECT 1
           FROM StaffPayments
           WHERE staffUserId = ?
             AND cycleMonth = ?
             AND cycleYear = ?
             AND status IN ('PENDING', 'SUCCESS')
         )
         BEGIN
           RAISERROR('Payment cycle already initiated or paid for this staff member.', 16, 1);
         END

         INSERT INTO StaffPayments (
           staffUserId,
           initiatedByUserId,
           cycleMonth,
           cycleYear,
           amount,
           method,
           status,
           transaction_id,
           notes,
           created_at
         )
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, GETDATE());

         COMMIT TRAN;
       END TRY
       BEGIN CATCH
         IF @@TRANCOUNT > 0
           ROLLBACK TRAN;

         DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
         RAISERROR(@Err, 16, 1);
       END CATCH`,
      [
        resolvedStaffUserId,
        resolvedCycleMonth,
        resolvedCycleYear,
        resolvedStaffUserId,
        resolvedInitiatedBy,
        resolvedCycleMonth,
        resolvedCycleYear,
        resolvedAmount,
        resolvedMethod,
        transactionId,
        notes || '',
      ]
    );

    const returnUrl = `${BACKEND_BASE_URL}/api/staff-payments/callback/redirect`;

    let redirectUrl;
    try {
      redirectUrl = await getPaymentProviderRedirectUrl({
        method: resolvedMethod,
        transactionId,
        amount: resolvedAmount,
        invoiceId: null,
        studentId: resolvedStaffUserId,
        returnUrl,
      });
      if (!redirectUrl) {
        throw new Error('Payment provider did not return a redirect URL');
      }
    } catch (providerError) {
      // Demo-safe fallback for local testing without provider credentials.
      redirectUrl = `${FRONTEND_BASE_URL}/payment/process?transaction_id=${encodeURIComponent(transactionId)}&method=${encodeURIComponent(resolvedMethod)}&paymentType=STAFF`;
      return res.json({
        transactionId,
        redirectUrl,
        amount: resolvedAmount,
        method: resolvedMethod,
        cycleMonth: resolvedCycleMonth,
        cycleYear: resolvedCycleYear,
        message: 'Staff payment initialized in demo mode (provider unavailable)',
      });
    }

    res.json({
      transactionId,
      redirectUrl,
      amount: resolvedAmount,
      method: resolvedMethod,
      cycleMonth: resolvedCycleMonth,
      cycleYear: resolvedCycleYear,
      message: 'Staff payment initiated successfully',
    });
  } catch (err) {
    console.error('Staff payment initiate error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

app.all('/api/staff-payments/callback/redirect', async (req, res) => {
  try {
    const payload = req.method === 'GET' ? req.query : req.body;
    const transactionId = payload.transaction_id || payload.transactionId || payload.invoiceNumber || payload.merchantInvoiceNumber;
    const rawStatus = (payload.status || payload.result || payload.paymentStatus || '').toString().toUpperCase();
    const reference = payload.reference || payload.paymentId || payload.tranId || payload.transaction_id || '';

    if (!transactionId) {
      return res.status(400).send('transaction_id is required');
    }

    const paymentRows = await query('SELECT TOP 1 * FROM StaffPayments WHERE transaction_id = ?', [transactionId]);
    if (!paymentRows || paymentRows.length === 0) {
      return res.status(404).send('Staff payment not found');
    }

    let newStatus = 'FAILED';
    if (rawStatus.includes('SUCCESS') || rawStatus.includes('PAID') || rawStatus.includes('COMPLETED') || rawStatus === '1' || rawStatus === 'OK') {
      newStatus = 'SUCCESS';
    } else if (rawStatus.includes('PENDING')) {
      newStatus = 'PENDING';
    }

    if (newStatus === 'SUCCESS' && String(paymentRows[0]?.status || '').toUpperCase() === 'PENDING') {
      const payment = paymentRows[0];
      await query(
        `BEGIN TRY
           BEGIN TRAN;

           IF (SELECT balance FROM Users WHERE id = ?) < ?
           BEGIN
             RAISERROR('Admin has insufficient balance for salary payment.', 16, 1);
           END

           UPDATE Users SET balance = balance - ? WHERE id = ?;
           UPDATE Users SET balance = balance + ? WHERE id = ?;

           UPDATE StaffPayments
           SET status = ?, reference = ?, paidDate = GETDATE()
           WHERE transaction_id = ?;

           UPDATE StaffSalaryPrompts
           SET status = 'RESOLVED', resolvedByUserId = ?, resolved_at = GETDATE()
           WHERE staffUserId = ? AND cycleMonth = ? AND cycleYear = ? AND status = 'PENDING';

           COMMIT TRAN;
         END TRY
         BEGIN CATCH
           IF @@TRANCOUNT > 0
             ROLLBACK TRAN;

           DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
           RAISERROR(@Err, 16, 1);
         END CATCH`,
        [
          payment.initiatedByUserId,
          Number(payment.amount || 0),
          Number(payment.amount || 0),
          payment.initiatedByUserId,
          Number(payment.amount || 0),
          payment.staffUserId,
          'SUCCESS',
          reference || '',
          transactionId,
          payment.initiatedByUserId,
          payment.staffUserId,
          payment.cycleMonth,
          payment.cycleYear,
        ]
      );
    } else {
      await query(
        'UPDATE StaffPayments SET status = ?, reference = ?, paidDate = CASE WHEN ? = ? THEN GETDATE() ELSE paidDate END WHERE transaction_id = ?',
        [newStatus, reference || '', newStatus, 'SUCCESS', transactionId]
      );
    }

    const method = paymentRows[0]?.method || 'BKASH';
    const redirectAfter = `${FRONTEND_BASE_URL}/payment/process?transaction_id=${encodeURIComponent(transactionId)}&method=${encodeURIComponent(method)}&paymentType=STAFF`;
    return res.redirect(302, redirectAfter);
  } catch (err) {
    console.error('Staff payment redirect callback error:', err);
    res.status(500).send('Internal server error');
  }
});

app.post('/api/staff-payments/callback/success', async (req, res) => {
  try {
    const { transaction_id, reference } = req.body || {};
    if (!transaction_id) {
      return res.status(400).json({ message: 'transaction_id is required' });
    }

    const paymentRows = await query('SELECT TOP 1 * FROM StaffPayments WHERE transaction_id = ? AND status = ?', [transaction_id, 'PENDING']);
    if (!paymentRows || paymentRows.length === 0) {
      return res.status(404).json({ message: 'Staff payment not found or already processed' });
    }

    const payment = paymentRows[0];
    await query(
      `BEGIN TRY
         BEGIN TRAN;

         IF (SELECT balance FROM Users WHERE id = ?) < ?
         BEGIN
           RAISERROR('Admin has insufficient balance for salary payment.', 16, 1);
         END

         UPDATE Users SET balance = balance - ? WHERE id = ?;
         UPDATE Users SET balance = balance + ? WHERE id = ?;

         UPDATE StaffPayments SET status = ?, reference = ?, paidDate = GETDATE() WHERE transaction_id = ?;

         UPDATE StaffSalaryPrompts
         SET status = 'RESOLVED', resolvedByUserId = ?, resolved_at = GETDATE()
         WHERE staffUserId = ? AND cycleMonth = ? AND cycleYear = ? AND status = 'PENDING';

         COMMIT TRAN;
       END TRY
       BEGIN CATCH
         IF @@TRANCOUNT > 0
           ROLLBACK TRAN;

         DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
         RAISERROR(@Err, 16, 1);
       END CATCH`,
      [
        payment.initiatedByUserId,
        Number(payment.amount || 0),
        Number(payment.amount || 0),
        payment.initiatedByUserId,
        Number(payment.amount || 0),
        payment.staffUserId,
        'SUCCESS',
        reference || '',
        transaction_id,
        payment.initiatedByUserId,
        payment.staffUserId,
        payment.cycleMonth,
        payment.cycleYear,
      ]
    );

    res.json({ message: 'Staff payment processed successfully' });
  } catch (err) {
    console.error('Staff payment success callback error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.post('/api/staff-payments/callback/failure', async (req, res) => {
  try {
    const { transaction_id } = req.body || {};
    if (!transaction_id) {
      return res.status(400).json({ message: 'transaction_id is required' });
    }

    const paymentRows = await query('SELECT TOP 1 * FROM StaffPayments WHERE transaction_id = ? AND status = ?', [transaction_id, 'PENDING']);
    if (!paymentRows || paymentRows.length === 0) {
      return res.status(404).json({ message: 'Staff payment not found or already processed' });
    }

    await query('UPDATE StaffPayments SET status = ? WHERE transaction_id = ?', ['FAILED', transaction_id]);
    res.json({ message: 'Staff payment failure recorded' });
  } catch (err) {
    console.error('Staff payment failure callback error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.get('/api/staff-payments/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required' });
    }

    const paymentRows = await query('SELECT TOP 1 * FROM StaffPayments WHERE transaction_id = ?', [transactionId]);
    if (!paymentRows || paymentRows.length === 0) {
      return res.status(404).json({ message: 'Staff payment not found' });
    }

    const record = paymentRows[0];
    res.json({
      transactionId: record.transaction_id,
      staffUserId: record.staffUserId,
      cycleMonth: record.cycleMonth,
      cycleYear: record.cycleYear,
      amount: record.amount,
      method: record.method,
      status: record.status,
      reference: record.reference || null,
      paidDate: record.paidDate,
      createdAt: record.created_at ? new Date(record.created_at).toISOString() : null,
    });
  } catch (err) {
    console.error('Staff payment status error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Seed sample rooms with varied attributes (one-time safe)
async function seedSampleRooms() {
  try {
    // Check if we already have sample rooms (room numbers starting with specific patterns)
    const existingRooms = await query("SELECT COUNT(*) AS cnt FROM Rooms WHERE roomNumber IN ('101-AC-WiFi', '102-AC-Bath', '103-WiFi-Balcony', '104-AC-Bath-WiFi', '105-Balcony', '201-Standard', '202-AC', '203-WiFi', '204-Bath', '205-AC-Balcony', '301-AC-WiFi-Bath', '302-AC-WiFi-Balcony', '303-Bath-Balcony', '304-Standard', '305-AC-Bath-WiFi-Balcony')");
    
    const count = Number(existingRooms?.[0]?.cnt || 0);
    if (count > 0) {
      console.log(`✓ Sample rooms already exist (${count} rooms found)`);
      return;
    }

    const sampleRooms = [
      { roomNumber: '101-AC-WiFi', block: 'Block A', floor: 1, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 1, hasBalcony: 0, hasAttachedBathroom: 0 },
      { roomNumber: '102-AC-Bath', block: 'Block A', floor: 1, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 0, hasBalcony: 0, hasAttachedBathroom: 1 },
      { roomNumber: '103-WiFi-Balcony', block: 'Block A', floor: 1, capacity: 2, type: 'SHARED', hasAC: 0, hasWifi: 1, hasBalcony: 1, hasAttachedBathroom: 0 },
      { roomNumber: '104-AC-Bath-WiFi', block: 'Block A', floor: 1, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 1, hasBalcony: 0, hasAttachedBathroom: 1 },
      { roomNumber: '105-Balcony', block: 'Block A', floor: 1, capacity: 3, type: 'SHARED', hasAC: 0, hasWifi: 0, hasBalcony: 1, hasAttachedBathroom: 0 },
      { roomNumber: '201-Standard', block: 'Block B', floor: 2, capacity: 2, type: 'SHARED', hasAC: 0, hasWifi: 0, hasBalcony: 0, hasAttachedBathroom: 0 },
      { roomNumber: '202-AC', block: 'Block B', floor: 2, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 0, hasBalcony: 0, hasAttachedBathroom: 0 },
      { roomNumber: '203-WiFi', block: 'Block B', floor: 2, capacity: 2, type: 'SHARED', hasAC: 0, hasWifi: 1, hasBalcony: 0, hasAttachedBathroom: 0 },
      { roomNumber: '204-Bath', block: 'Block B', floor: 2, capacity: 3, type: 'SHARED', hasAC: 0, hasWifi: 0, hasBalcony: 0, hasAttachedBathroom: 1 },
      { roomNumber: '205-AC-Balcony', block: 'Block B', floor: 2, capacity: 1, type: 'SINGLE', hasAC: 1, hasWifi: 0, hasBalcony: 1, hasAttachedBathroom: 0 },
      { roomNumber: '301-AC-WiFi-Bath', block: 'Block C', floor: 3, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 1, hasBalcony: 0, hasAttachedBathroom: 1 },
      { roomNumber: '302-AC-WiFi-Balcony', block: 'Block C', floor: 3, capacity: 2, type: 'SHARED', hasAC: 1, hasWifi: 1, hasBalcony: 1, hasAttachedBathroom: 0 },
      { roomNumber: '303-Bath-Balcony', block: 'Block C', floor: 3, capacity: 2, type: 'SHARED', hasAC: 0, hasWifi: 0, hasBalcony: 1, hasAttachedBathroom: 1 },
      { roomNumber: '304-Standard', block: 'Block C', floor: 3, capacity: 1, type: 'SINGLE', hasAC: 0, hasWifi: 0, hasBalcony: 0, hasAttachedBathroom: 0 },
      { roomNumber: '305-AC-Bath-WiFi-Balcony', block: 'Block C', floor: 3, capacity: 1, type: 'SINGLE', hasAC: 1, hasWifi: 1, hasBalcony: 1, hasAttachedBathroom: 1 },
    ];

    for (const room of sampleRooms) {
      const computedRent = calculateRoomRentFromAttributes({
        type: room.type,
        hasAC: room.hasAC,
        hasAttachedBathroom: room.hasAttachedBathroom,
        hasWifi: room.hasWifi,
        hasBalcony: room.hasBalcony,
      });

      await query(
        'INSERT INTO Rooms (roomNumber, block, floor, capacity, type, hasAC, hasAttachedBathroom, hasWifi, hasBalcony, rentalCost, status, hostelId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [room.roomNumber, room.block, room.floor, room.capacity, room.type, room.hasAC, room.hasAttachedBathroom, room.hasWifi, room.hasBalcony, computedRent, 'AVAILABLE', 1]
      );

      const insertedRoom = await query('SELECT TOP 1 id FROM Rooms WHERE roomNumber = ?', [room.roomNumber]);
      if (insertedRoom && insertedRoom.length > 0) {
        await ensureBedsForRoom(insertedRoom[0].id, room.capacity);
      }
    }

    console.log(`✓ Seeded ${sampleRooms.length} sample rooms with varied attributes`);
  } catch (err) {
    console.error('Error seeding sample rooms:', err);
  }
}

// Start server
async function startServer() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  await ensureFeatureTables();
  await seedSampleRooms();
  await recordOccupancySnapshot();

  app.listen(PORT, () => {
    console.log(`✓ Hostel Management System Backend running on http://localhost:${PORT}/api`);
  });
}

startServer();