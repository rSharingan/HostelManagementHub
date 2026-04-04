import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './app/App'
import { AuthProvider } from './features/auth/AuthProvider'  // 👈 ADD THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>   {/* 👈 ADD THIS */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)