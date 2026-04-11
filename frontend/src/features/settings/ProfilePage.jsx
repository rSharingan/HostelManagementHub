// path: src/features/settings/ProfilePage.jsx
import { PageHeader } from '../../components/common/PageHeader'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/hooks'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { getInitials, formatDate } from '../../lib/utils'
import Input from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useChangePassword } from './hooks'

export const ProfilePage = () => {
  const { user } = useAuth()
  const changePassword = useChangePassword()
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const onPasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!user?.email) {
      toast.error('Could not identify logged-in user')
      return
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    try {
      await changePassword.mutateAsync({
        email: user.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to change password')
    }
  }

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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">
              {user?.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-400 mb-2">
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
                <p className="text-sm text-gray-600 dark:text-dark-400">
                  Name
                </p>
                <p className="font-medium text-gray-900 dark:text-dark-50">
                  {user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-dark-50">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-400">
                  Role
                </p>
                <p className="font-medium text-gray-900 dark:text-dark-50">
                  {user?.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-400">
                  Status
                </p>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Change Password</h3>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-lg" onSubmit={handleChangePassword}>
              <Input
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => onPasswordFieldChange('currentPassword', e.target.value)}
                required
              />
              <Input
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => onPasswordFieldChange('newPassword', e.target.value)}
                helperText="Use at least 6 characters"
                required
              />
              <Input
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => onPasswordFieldChange('confirmPassword', e.target.value)}
                required
              />
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
