import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

type Tab = 'signin' | 'signup'

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: '', color: '#2a2a2a' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f97316' },
    { label: 'Good', color: '#eab308' },
    { label: 'Strong', color: '#4ade80' },
  ]
  return { score, ...levels[score] }
}

function Auth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const resetState = (newTab: Tab) => {
    setTab(newTab)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
    setPhone('')
    setOtp('')
    setOtpSent(false)
  }

  const strength = getStrength(password)

  /* ---- Sign In ---- */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  /* ---- Sign Up ---- */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (strength.score < 2) { setError('Please choose a stronger password.'); return }
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('Check your email for a confirmation link!')
  }

  /* ---- OAuth (sign in only) ---- */
  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  /* ---- Phone OTP (sign in only) ---- */
  const handleSendOtp = async () => {
    if (!phone.trim()) return
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (error) setError(error.message)
    else setOtpSent(true)
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="auth-page">
      <nav className="nav">
        <span className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          &#x1F33F; Poshanix
        </span>
      </nav>

      <main className="auth-container">
        <div className="auth-card">
          {/* Tab switcher */}
          <div className="tab-bar">
            <button
              className={`tab-btn ${tab === 'signin' ? 'tab-active' : ''}`}
              onClick={() => resetState('signin')}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${tab === 'signup' ? 'tab-active' : ''}`}
              onClick={() => resetState('signup')}
            >
              Sign Up
            </button>
          </div>

          <h2 className="auth-title">
            {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {tab === 'signin'
              ? 'Sign in to continue to Poshanix'
              : 'Sign up to get started with Poshanix'}
          </p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {/* OAuth + Phone — Sign In only */}
          {tab === 'signin' && (
            <>
              <div className="oauth-group">
                <button className="oauth-btn google-btn" onClick={() => handleOAuth('google')}>
                  <svg viewBox="0 0 48 48" width="20" height="20">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>

                <button className="oauth-btn github-btn" onClick={() => handleOAuth('github')}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              <div className="divider"><span>or continue with email</span></div>
            </>
          )}

          {/* Email form */}
          <form className="email-form" onSubmit={tab === 'signin' ? handleSignIn : handleSignUp}>
            {tab === 'signup' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="password-wrap">
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {tab === 'signup' && password.length > 0 && (
                <div className="strength-bar-wrap">
                  <div className="strength-segments">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="strength-seg"
                        style={{
                          background: i <= strength.score ? strength.color : '#2a2a2a',
                        }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
            {tab === 'signup' && (
              <input
                className="auth-input"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading
                ? 'Please wait…'
                : tab === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Phone OTP — Sign In only */}
          {tab === 'signin' && (
            <>
              <div className="divider"><span>or use phone</span></div>
              <div className="phone-group">
                {!otpSent ? (
                  <>
                    <input
                      className="auth-input"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <button className="phone-btn" onClick={handleSendOtp} disabled={loading}>
                      {loading ? 'Sending…' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="otp-info">OTP sent to <strong>{phone}</strong></p>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                    <button className="phone-btn" onClick={handleVerifyOtp} disabled={loading}>
                      {loading ? 'Verifying…' : 'Verify & Sign In'}
                    </button>
                    <button className="resend-btn" onClick={() => { setOtpSent(false); setOtp('') }}>
                      ← Change number
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          <p className="auth-footer-text">
            {tab === 'signin' ? (
              <>Don't have an account?{' '}
                <button className="link-btn" onClick={() => resetState('signup')}>Sign Up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="link-btn" onClick={() => resetState('signin')}>Sign In</button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}

export default Auth
