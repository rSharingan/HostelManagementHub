// path: src/app/router.jsx
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '../features/auth/RequireAuth'
import { LoginPage } from '../features/auth/LoginPage'
import { SignupPage } from '../features/auth/SignupPage'
import { AppLayout } from '../components/layout/AppLayout'

// Pages
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { StudentsPage } from '../features/students/StudentsPage'
import { StudentDetailsPage } from '../features/students/StudentDetailsPage'
import { RoomsPage } from '../features/rooms/RoomsPage'
import { RoomDetailsPage } from '../features/rooms/RoomDetailsPage'
import { AllocationsPage } from '../features/allocations/AllocationsPage'
import { InvoicesPage } from '../features/fees/InvoicesPage'
import { PaymentsPage } from '../features/fees/PaymentsPage'
import { StaffPage } from '../features/staff/StaffPage'
import { MaintenancePage } from '../features/maintenance/MaintenancePage'
import { OccupancyReportPage } from '../features/reports/OccupancyReportPage'
import { DuesReportPage } from '../features/reports/DuesReportPage'
import { MaintenanceReportPage } from '../features/reports/MaintenanceReportPage'
import { ProfilePage } from '../features/settings/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/students',
    element: (
      <RequireAuth>
        <AppLayout>
          <StudentsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/students/:id',
    element: (
      <RequireAuth>
        <AppLayout>
          <StudentDetailsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/rooms',
    element: (
      <RequireAuth>
        <AppLayout>
          <RoomsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/rooms/:id',
    element: (
      <RequireAuth>
        <AppLayout>
          <RoomDetailsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/allocations',
    element: (
      <RequireAuth>
        <AppLayout>
          <AllocationsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/fees/invoices',
    element: (
      <RequireAuth>
        <AppLayout>
          <InvoicesPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/fees/payments',
    element: (
      <RequireAuth>
        <AppLayout>
          <PaymentsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/staff',
    element: (
      <RequireAuth>
        <AppLayout>
          <StaffPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/maintenance',
    element: (
      <RequireAuth>
        <AppLayout>
          <MaintenancePage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/occupancy',
    element: (
      <RequireAuth>
        <AppLayout>
          <OccupancyReportPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/dues',
    element: (
      <RequireAuth>
        <AppLayout>
          <DuesReportPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/maintenance',
    element: (
      <RequireAuth>
        <AppLayout>
          <MaintenanceReportPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/settings/profile',
    element: (
      <RequireAuth>
        <AppLayout>
          <ProfilePage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '*',
    element: (
      <RequireAuth>
        <AppLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Page not found
            </h1>
          </div>
        </AppLayout>
      </RequireAuth>
    ),
  },
])
