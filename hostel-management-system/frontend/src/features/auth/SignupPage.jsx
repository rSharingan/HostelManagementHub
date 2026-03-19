// path: src/features/auth/SignupPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupAPI } from './api'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { name, email, password, role } = formData
      
      // Call signup API
      const result = await signupAPI(name, email, password, role)
      
      // Store token and user in localStorage
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      
      // Redirect based on role
      if (role === 'STUDENT') {
        navigate('/student-portal')
      } else if (role === 'WARDEN') {
        navigate('/warden-dashboard')
      } else if (role === 'CARETAKER') {
        navigate('/caretaker-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Create Account
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Join as {formData.role === 'STUDENT' ? 'a student' : 'staff'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="user@hostel.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="ADMIN">Admin</option>
                <option value="WARDEN">Warden</option>
                <option value="CARETAKER">Caretaker</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>

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
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Login here
                </Link>
              </p>
            </div>

            <div className="pt-2">
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
