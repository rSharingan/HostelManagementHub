// path: src/features/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './hooks'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center border-0 pb-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              HMS
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Hostel Management System
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@hostel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Demo Credentials:
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                Email: admin@hostel.com
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Password: password
              </p>
            </div>

            <div className="pt-2">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
