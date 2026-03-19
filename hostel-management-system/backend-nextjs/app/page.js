// Home page is a simple static server component. Database initialization
// is now handled via Prisma migrations and seeding script. No mssql driver or
// manual connection is required here.

export default async function Home() {

  return (
    <main>
      <h1>Hostel Management Backend API</h1>
      <p>API is running. Use the following endpoints:</p>
      <ul>
        <li>POST /api/auth/login - Login</li>
        <li>GET/POST /api/students - Students</li>
        <li>GET/POST /api/rooms - Rooms</li>
        <li>GET/POST /api/allocations - Allocations</li>
        <li>GET/POST /api/staff - Staff</li>
        <li>GET/POST /api/maintenance - Maintenance</li>
        <li>GET/POST /api/fees/invoices - Invoices</li>
        <li>GET/POST /api/fees/payments - Payments</li>
        <li>GET /api/reports/occupancy - Occupancy Report</li>
        <li>GET /api/reports/dues - Dues Report</li>
        <li>GET /api/reports/maintenance - Maintenance Report</li>
      </ul>
    </main>
  )
}
