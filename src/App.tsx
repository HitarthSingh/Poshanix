import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Food from './pages/Food'
import Profile from './pages/Profile'
import Privacy from './legal/Privacy'
import Terms from './legal/Terms'
import { useTheme } from './lib/useTheme'
import ThemeSwitch from './components/Switch'
import './App.css'

function Landing() {
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()

  return (
    <div className="page">
      <nav className="nav">
        <span className="nav-logo">&#x1F33F; Poshanix</span>
        <ThemeSwitch checked={theme === 'dark'} onToggle={toggleTheme} />
      </nav>

      <main className="hero">
        <div className="badge">AI-Powered</div>
        <h1 className="hero-title">
          Scan. Analyze.<br />
          <span className="accent">Eat Smarter.</span>
        </h1>
        <p className="hero-sub">
          Instantly decode the nutrition in any food — just snap a photo
          and let AI do the rest.
        </p>
        <button className="cta-btn" onClick={() => navigate('/auth')}>
          Get Started
        </button>
      </main>

      <footer className="footer landing-footer">
        <span>&copy; {new Date().getFullYear()} Poshanix</span>
        <span className="footer-dot">·</span>
        <span className="footer-link" onClick={() => navigate('/privacy')}>Privacy Policy</span>
        <span className="footer-dot">·</span>
        <span className="footer-link" onClick={() => navigate('/terms')}>Terms of Service</span>
      </footer>
    </div>
  )
}

function App() {
  useEffect(() => {
    try { document.body.classList.add('app-mounted') } catch (e) { /* ignore */ }
    return () => { try { document.body.classList.remove('app-mounted') } catch (e) { /* ignore */ } }
  }, [])
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/home" element={<Home />} />
        <Route path="/food" element={<Food />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
    </Routes>
  )
}

export default App
