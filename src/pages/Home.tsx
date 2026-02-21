import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/useTheme'
import ThemeSwitch from '../components/Switch'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/auth')
      else { setUser(data.user); setLoading(false) }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/auth')
    })

    return () => listener.subscription.unsubscribe()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  if (loading) {
    return (
      <div className="home-loader">
        <div className="spinner" />
      </div>
    )
  }

  const meta = user?.user_metadata ?? {}
  const displayName = meta.full_name || meta.name || user?.email?.split('@')[0] || 'there'
  const avatar = meta.avatar_url
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="home-page">
      {/* Nav */}
      <nav className="nav home-nav">
        <span className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          &#x1F33F; Poshanix
        </span>
        <div className="home-nav-right">
          <ThemeSwitch checked={theme === 'dark'} onToggle={toggleTheme} />
          <div className="avatar-wrap">
            {avatar
              ? <img src={avatar} className="user-avatar" alt="avatar" />
              : <div className="avatar-initials">{initials}</div>}
          </div>
          <span className="user-display-name">{displayName}</span>
          <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      {/* Main */}
      <main className="home-main">
        <div className="home-welcome">
          <div className="badge">Dashboard</div>
          <h1 className="home-title">
            Hello, <span className="accent">{displayName}</span> 👋
          </h1>
          <p className="home-sub">
            Your AI-powered nutrition companion is ready. Choose a feature below to get started.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card feature-highlight">
            <div className="feature-icon">📸</div>
            <h3>Scan Food</h3>
            <p>Snap a photo and instantly get full nutrition insights powered by AI.</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Nutrition Log</h3>
            <p>Track your daily intake and monitor macro goals over time.</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Goals</h3>
            <p>Set personalized calorie and macro targets tailored to you.</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
