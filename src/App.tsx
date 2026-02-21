import './App.css'

function App() {
  return (
    <div className="page">
      <nav className="nav">
        <span className="nav-logo">&#x1F33F; Poshanix</span>
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
        <button className="cta-btn">Get Started</button>
      </main>

      <footer className="footer">
        &copy; {new Date().getFullYear()} Poshanix
      </footer>
    </div>
  )
}

export default App
