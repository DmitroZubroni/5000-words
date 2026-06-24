import { AuthProvider } from './core/context/AuthContext'
import { ThemeProvider } from './core/context/ThemeContext'
import Router from './core/routing/Router'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  )
}