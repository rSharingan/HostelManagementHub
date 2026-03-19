// path: src/features/settings/ProfilePage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../auth/hooks'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { getInitials, formatDate } from '../../lib/utils'

export const ProfilePage = () => {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        description="Manage your account settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
          { label: 'Profile' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {getInitials(user?.name)}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {user?.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {user?.email}
            </p>
            <Badge className="inline-block">{user?.role}</Badge>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold">Account Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Name
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Email
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Role
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {user?.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Status
                </p>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TODO: Add Edit Profile, Change Password, etc. */}
      <div className="mt-8 p-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Additional settings coming soon...
        </p>
      </div>
    </div>
  )
}
