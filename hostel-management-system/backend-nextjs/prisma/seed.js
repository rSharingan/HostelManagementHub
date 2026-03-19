const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Delete existing data
  await prisma.payment.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.allocation.deleteMany({})
  await prisma.maintenance.deleteMany({})
  await prisma.staffMember.deleteMany({})
  await prisma.room.deleteMany({})
  await prisma.student.deleteMany({})
  await prisma.user.deleteMany({})

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@hostel.com',
      password: 'password',
      role: 'ADMIN',
    },
  })

  await prisma.user.createMany({
    data: [
      {
        name: 'John Warden',
        email: 'warden@hostel.com',
        password: 'password',
        role: 'WARDEN',
      },
      {
        name: 'Sarah Accountant',
        email: 'accountant@hostel.com',
        password: 'password',
        role: 'ACCOUNTANT',
      },
      {
        name: 'Mike Caretaker',
        email: 'caretaker@hostel.com',
        password: 'password',
        role: 'CARETAKER',
      },
    ],
  })

  // Create Students
  const student1 = await prisma.student.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      registrationNumber: 'REG-001',
      department: 'Computer Science',
      yearOfStudy: 2,
      password: 'password',
      status: 'ACTIVE',
    },
  })

  const student2 = await prisma.student.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      registrationNumber: 'REG-002',
      department: 'Engineering',
      yearOfStudy: 1,
      status: 'ACTIVE',
    },
  })

  // Create Rooms
  const room1 = await prisma.room.create({
    data: {
      roomNumber: '101',
      block: 'A',
      floor: 1,
      capacity: 2,
      type: 'Single',
      rentalCost: 500,
      status: 'AVAILABLE',
    },
  })

  const room2 = await prisma.room.create({
    data: {
      roomNumber: '102',
      block: 'A',
      floor: 1,
      capacity: 2,
      type: 'Double',
      rentalCost: 700,
      status: 'OCCUPIED',
    },
  })

  // Create Allocations
  await prisma.allocation.create({
    data: {
      studentId: student1.id,
      roomId: room2.id,
      checkInDate: new Date('2024-01-15'),
      status: 'ACTIVE',
    },
  })

  // Create Staff
  await prisma.staffMember.createMany({
    data: [
      {
        name: 'John Warden',
        email: 'warden@hostel.com',
        position: 'Warden',
        department: 'Administration',
        salary: 50000,
        status: 'ACTIVE',
      },
      {
        name: 'Sarah Caretaker',
        email: 'caretaker@hostel.com',
        position: 'Caretaker',
        department: 'Maintenance',
        status: 'ACTIVE',
      },
    ],
  })

  // Create Maintenance
  await prisma.maintenance.createMany({
    data: [
      {
        description: 'Leaky faucet',
        room: '101',
        priority: 'LOW',
        status: 'PENDING',
        reportedDate: new Date('2024-03-01'),
      },
      {
        description: 'Broken window',
        room: '102',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        reportedDate: new Date('2024-02-28'),
        assignedTo: 2,
      },
    ],
  })

  // Create Invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      studentId: student1.id,
      amount: 500,
      dueDate: new Date('2024-04-01'),
      status: 'PENDING',
      month: 'March',
      year: 2024,
    },
  })

  const invoice2 = await prisma.invoice.create({
    data: {
      studentId: student2.id,
      amount: 700,
      dueDate: new Date('2024-02-01'),
      status: 'PAID',
      month: 'February',
      year: 2024,
    },
  })

  // Create Payments
  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      studentId: student2.id,
      amount: 700,
      paymentDate: new Date('2024-02-15'),
      method: 'BANK_TRANSFER',
      reference: 'TXN123456',
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
