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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Login Page Background - Student Logo Pattern */}
      <div className="absolute inset-0 -z-10">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900"></div>
        
        {/* Decorative SVG pattern - Student caps/books */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-20" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="studentPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              {/* Student cap icons scattered */}
              <path d="M 50 80 L 100 50 L 150 80 L 100 100 Z" fill="white" opacity="0.6"/>
              <rect x="40" y="85" width="120" height="8" fill="white" opacity="0.4"/>
              {/* Open book */}
              <path d="M 30 120 L 50 110 L 50 130 Z" fill="white" opacity="0.5"/>
              <path d="M 170 120 L 150 110 L 150 130 Z" fill="white" opacity="0.5"/>
              <rect x="50" y="115" width="100" height="10" fill="white" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#studentPattern)"/>
        </svg>

        {/* Floating shapes for visual interest */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-blue-400 opacity-10 dark:opacity-5 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-purple-400 opacity-10 dark:opacity-5 rounded-full blur-3xl animate-float-slower" style={{animationDelay: '2s'}}></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center border-0 pb-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-50">
              HMS
            </h1>
            <p className="text-sm text-gray-600 dark:text-dark-400 mt-2">
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

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-800">
              <p className="text-xs text-gray-600 dark:text-dark-400 text-center">
                Demo Credentials:
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-400 text-center mt-1">
                Email: admin@hostel.com
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
                Password: password
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-dark-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
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
