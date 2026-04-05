-- Hostel Management System Database Setup
-- Run this script in your MS SQL Server to create the database and tables

CREATE DATABASE HostelManagement;
GO

USE HostelManagement;
GO

-- Users table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'WARDEN', 'CARETAKER', 'STUDENT'))
);

-- Students table
CREATE TABLE Students (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    registrationNumber VARCHAR(50),
    department VARCHAR(100),
    yearOfStudy INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    password VARCHAR(255) NOT NULL
);



-- Maintenance table (for complaints)
CREATE TABLE Maintenance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    description TEXT NOT NULL,
    room VARCHAR(50),
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PENDING',
    reportedDate DATETIME NOT NULL,
    assignedTo INT
);

-- Payments table
CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    invoiceId INT,
    studentId INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentDate DATETIME NOT NULL,
    method VARCHAR(50) DEFAULT 'CASH',
    reference VARCHAR(100)
);

-- Insert default admin user
INSERT INTO Users (name, email, password, role) VALUES ('Admin', 'admin@hostel.com', 'password', 'ADMIN');

-- Insert sample student
INSERT INTO Students (name, email, phone, registrationNumber, department, yearOfStudy, status, password)
VALUES ('Alice Johnson', 'alice@example.com', '1234567890', 'REG-001', 'Computer Science', 2, 'ACTIVE', 'password');

-- Insert sample rooms
INSERT INTO Rooms (roomNumber, block, floor, capacity, type, rentalCost, status)
VALUES ('101', 'A', 1, 2, 'Single', 500.00, 'AVAILABLE');

INSERT INTO Rooms (roomNumber, block, floor, capacity, type, rentalCost, status)
VALUES ('102', 'A', 1, 2, 'Single', 500.00, 'AVAILABLE');

-- Insert sample allocation if none exists
BEGIN TRY
  IF NOT EXISTS (SELECT 1 FROM Allocations)
  BEGIN
    DECLARE @sId INT, @rId INT;
    SELECT TOP 1 @sId = id FROM Students ORDER BY id;
    SELECT TOP 1 @rId = id FROM Rooms WHERE status = 'AVAILABLE' ORDER BY id;

    IF @sId IS NOT NULL AND @rId IS NOT NULL
    BEGIN
      INSERT INTO Allocations (studentId, roomId, checkInDate, status)
      VALUES (@sId, @rId, GETDATE(), 'ACTIVE');
      UPDATE Rooms SET status = 'OCCUPIED', studentId = @sId WHERE id = @rId;
    END
  END
END TRY
BEGIN CATCH
  -- ignore if columns are named differently
END CATCH

-- Allocations table
CREATE TABLE Allocations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    studentId INT NOT NULL,
    roomId INT NOT NULL,
    checkInDate DATETIME2 DEFAULT GETDATE(),
    checkOutDate DATETIME2 NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    FOREIGN KEY (studentId) REFERENCES Students(id),
    FOREIGN KEY (roomId) REFERENCES Rooms(id)
);