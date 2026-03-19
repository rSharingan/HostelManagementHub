export const metadata = {
  title: 'Hostel Management Backend',
  description: 'Backend API for Hostel Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
