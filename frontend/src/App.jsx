import { AuthProvider } from './core/context/AuthContext'
import { ThemeProvider } from './core/context/ThemeContext'
import { ToastProvider } from './core/context/ToastContext'
import Router from './core/routing/Router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}