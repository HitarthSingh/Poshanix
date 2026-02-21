import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import Switch from '../components/Switch'
import './Legal.css'

function Privacy() {
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()

  return (
    <div className="legal-page">
      <nav className="nav legal-nav">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <span className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          &#x1F33F; Poshanix
        </span>
        <Switch checked={theme === 'dark'} onToggle={toggleTheme} />
      </nav>

      <main className="legal-main">
        <div className="legal-header">
          <span className="legal-tag">Legal</span>
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: February 21, 2026</p>
        </div>

        <div className="legal-body">
          <section>
            <h2>1. Information We Collect</h2>
            <p>When you use Poshanix, we collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information such as your name and email address when you register.</li>
              <li>Food photos or descriptions you submit for nutritional analysis.</li>
              <li>Usage data such as features you interact with and time spent in the app.</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Poshanix service.</li>
              <li>Generate AI-powered nutritional analyses from your food inputs.</li>
              <li>Send transactional emails such as account confirmations and security alerts.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage</h2>
            <p>Your data is stored securely using Supabase infrastructure. We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2>4. Third-Party Services</h2>
            <p>Poshanix uses the following third-party services which have their own privacy policies:</p>
            <ul>
              <li><strong>Supabase</strong> — authentication and database hosting.</li>
              <li><strong>Google / GitHub OAuth</strong> — optional sign-in providers.</li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>We use essential cookies and localStorage to maintain your session and remember your theme preference. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at <a href="mnoreply.poshanix@gmail.com">noreply.poshanix@gmail.com</a>.</p>
          </section>

          <section>
            <h2>7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated date.</p>
          </section>
        </div>
      </main>

      <footer className="footer legal-footer">
        &copy; {new Date().getFullYear()} Poshanix &mdash;{' '}
        <span className="legal-footer-link" onClick={() => navigate('/terms')}>Terms of Service</span>
      </footer>
    </div>
  )
}

export default Privacy
