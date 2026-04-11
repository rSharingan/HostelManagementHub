// path: src/features/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './hooks'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Lock, Mail } from 'lucide-react'

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
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Main gradient background with animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 animate-gradient-shift"></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{
          backgroundImage: 'linear-gradient(45deg, transparent 48%, rgba(255,255,255,.05) 49%, rgba(255,255,255,.05) 51%, transparent 52%), linear-gradient(-45deg, transparent 48%, rgba(255,255,255,.03) 49%, rgba(255,255,255,.03) 51%, transparent 52%)',
          backgroundSize: '50px 50px'
        }}>
        </div>

        {/* Floating animated shapes */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-blue-400 opacity-20 dark:opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-purple-400 opacity-15 dark:opacity-5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-indigo-400 opacity-10 dark:opacity-5 rounded-full blur-3xl" style={{
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '1s'
        }}></div>

        {/* Animated light rays */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-b from-blue-300 to-transparent opacity-20 blur-3xl animate-float-slow" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-purple-300 to-transparent opacity-20 blur-3xl animate-float-slow" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Animated floating particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-30 dark:opacity-20 blur-sm"
            style={{
              width: Math.random() * 40 + 20 + 'px',
              height: Math.random() * 40 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float-particle ${Math.random() * 15 + 8}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>

      {/* Main Login Card with entrance animation */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 animate-fade-in-up">
        <style>{`
          @keyframes gradient-shift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          
          @keyframes float-particle {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 0.3;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100 - 50}px) scale(0.5);
              opacity: 0;
            }
          }
          
          @keyframes slide-in-left {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slide-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slide-in-left {
            animation: slide-in-left 0.6s ease-out forwards;
          }
          
          .animate-slide-in-up {
            animation: slide-in-up 0.6s ease-out forwards;
          }
          
          .animate-fade-in-up {
            animation: slide-in-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          
          .input-icon {
            transition: all 0.3s ease;
          }
          
          input:focus ~ .input-icon {
            color: rgb(59, 130, 246);
            transform: scale(1.1);
          }
          
          .form-input {
            position: relative;
            transition: all 0.3s ease;
          }
          
          .form-input:focus-within {
            transform: translateY(-2px);
          }
        `}</style>

        <CardHeader className="text-center border-0 pb-0 animate-slide-in-left">
          <div className="mb-8">
            {/* Animated logo with gradient */}
            <div className="inline-block mb-4">
              <div className="relative w-16 h-16 mx-auto">
                {/* Animated outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-75 blur-md animate-pulse" style={{animationDuration: '2s'}}></div>
                {/* Inner content */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">H</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
              HMS
            </h1>
            <p className="text-sm text-gray-600 dark:text-dark-400 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
              Hostel Management System
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="form-input animate-slide-in-up" style={{animationDelay: '0.3s'}}>
              <div className="relative">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-500 w-5 h-5 input-icon" />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-input animate-slide-in-up" style={{animationDelay: '0.4s'}}>
              <div className="relative">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-500 w-5 h-5 input-icon" />
              </div>
            </div>

            {/* Error Alert with animation */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg animate-slide-in-up">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Login Button with hover animation */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full animate-slide-in-up relative overflow-hidden group"
              style={{animationDelay: '0.5s'}}
            >
              <span className="relative z-10">
                {loading ? 'Logging in...' : 'Login'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></div>
            </Button>

            {/* Demo Credentials with animation */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-800 animate-slide-in-up" style={{animationDelay: '0.6s'}}>
              <p className="text-xs text-gray-600 dark:text-dark-400 text-center font-semibold mb-2">
                Demo Credentials:
              </p>
              <div className="space-y-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50">
                <p className="text-xs text-gray-600 dark:text-dark-300 text-center font-mono">
                  Email: <span className="text-blue-600 dark:text-blue-400 font-bold">admin@hostel.com</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-dark-300 text-center font-mono">
                  Password: <span className="text-blue-600 dark:text-blue-400 font-bold">password</span>
                </p>
              </div>
            </div>

            {/* Sign up Link with animation */}
            <div className="mt-4 text-center animate-slide-in-up" style={{animationDelay: '0.7s'}}>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-colors duration-200">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating background text decoration */}
      <div className="absolute bottom-4 right-4 text-white opacity-10 dark:opacity-5 text-sm font-light pointer-events-none">
        HMS © 2026
      </div>
    </div>
  )
}
