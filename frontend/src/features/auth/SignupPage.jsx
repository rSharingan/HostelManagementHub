// path: src/features/auth/SignupPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './hooks'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

export const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    yearOfStudy: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center p-4 animate-gradient">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 animate-pulse-glow"></div>
      <Card className="w-full max-w-md glass animate-fade-in-up relative z-10" variant="glass">
        <CardHeader className="text-center border-0 pb-0">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-glow">
              <span className="text-2xl font-bold text-white">HMS</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
              Hostel Management System
            </h1>
            <p className="text-gray-600 dark:text-dark-400 text-sm">
              Create your account to get started
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-300 mb-3">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-600 rounded-xl bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm text-gray-900 dark:text-dark-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-400"
                  required
                >
                  <option value="">Select your role</option>
                  <option value="STUDENT">🎓 Student</option>
                  <option value="WARDEN">🏢 Warden</option>
                  <option value="CARETAKER">🔧 Caretaker</option>
                </select>
              </div>

              {formData.role === 'STUDENT' && (
                <div className="space-y-4 animate-slide-in-left">
                  <Input
                    label="Department"
                    type="text"
                    placeholder="Computer Science"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    required
                  />

                  <Input
                    label="Year of Study"
                    type="number"
                    placeholder="2"
                    value={formData.yearOfStudy}
                    onChange={(e) => handleChange('yearOfStudy', e.target.value)}
                    required
                  />
                </div>
              )}

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in-up">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg"
              variant="primary"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center">
              <p className="text-gray-600 dark:text-dark-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors duration-200">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}