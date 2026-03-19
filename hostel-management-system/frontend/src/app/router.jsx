// path: src/app/router.jsx
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '../features/auth/RequireAuth'
import { LoginPage } from '../features/auth/LoginPage'
import { SignupPage } from '../features/auth/SignupPage'
import { AppLayout } from '../components/layout/AppLayout'
import { RoleBasedRedirect } from './RoleBasedRedirect'

// Pages
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { WardenDashboardPage } from '../features/dashboard/WardenDashboardPage'
import { CaretakerDashboardPage } from '../features/dashboard/CaretakerDashboardPage'
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
import { StudentDashboardPage } from '../features/student-portal/StudentDashboardPage'
import { StudentFeesPage } from '../features/student-portal/StudentFeesPage'
import { StudentRoomsPage } from '../features/student-portal/StudentRoomsPage'

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
        <RoleBasedRedirect />
      </RequireAuth>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth requiredRoles={['ADMIN']}>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/students',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <StudentsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/students/:id',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <StudentDetailsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/rooms',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <RoomsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/rooms/:id',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <RoomDetailsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/allocations',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <AllocationsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/fees/invoices',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <InvoicesPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/fees/payments',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <PaymentsPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/staff',
    element: (
      <RequireAuth requiredRoles={['ADMIN']}>
        <AppLayout>
          <StaffPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/maintenance',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN', 'CARETAKER']}>
        <AppLayout>
          <MaintenancePage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/occupancy',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <OccupancyReportPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/dues',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN']}>
        <AppLayout>
          <DuesReportPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/reports/maintenance',
    element: (
      <RequireAuth requiredRoles={['ADMIN', 'WARDEN', 'CARETAKER']}>
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
    path: '/warden-dashboard',
    element: (
      <RequireAuth requiredRoles={['WARDEN']}>
        <AppLayout>
          <WardenDashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/caretaker-dashboard',
    element: (
      <RequireAuth requiredRoles={['CARETAKER']}>
        <AppLayout>
          <CaretakerDashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/student-portal',
    element: (
      <RequireAuth requiredRoles={['STUDENT']}>
        <AppLayout>
          <StudentDashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/student-portal/fees',
    element: (
      <RequireAuth requiredRoles={['STUDENT']}>
        <AppLayout>
          <StudentFeesPage />
        </AppLayout>
      </RequireAuth>
    ),
  },
  {
    path: '/student-portal/rooms',
    element: (
      <RequireAuth requiredRoles={['STUDENT']}>
        <AppLayout>
          <StudentRoomsPage />
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
