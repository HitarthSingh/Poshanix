import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/useTheme'
import ThemeSwitch from '../components/Switch'
import Loader from '../components/loader'
import './Home.css'
import { createWorker } from 'tesseract.js'

function Home() {
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

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
          <div className="feature-card feature-highlight" onClick={() => setShowScanner(true)} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">📸</div>
            <h3>Scan Food</h3>
            <p>Snap a photo and instantly get full nutrition insights powered by AI.</p>
            <span className="action-hint">Click to scan</span>
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

      {showScanner && (
        <div className="scanner-backdrop" onClick={() => setShowScanner(false)}>
          <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
            <header className="scanner-header">
              <h3>Scan Food (OCR)</h3>
              <button className="link-btn" onClick={() => { setShowScanner(false); setImageSrc(null); setOcrText(''); setOcrProgress(0); }}>Close</button>
            </header>

            <div className="scanner-body">
              <div className="scanner-controls">
                <input type="file" accept="image/*" id="scanner-file" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = URL.createObjectURL(file)
                  setImageSrc(url)
                  setOcrText('')
                  // run OCR using the File object (more reliable than passing the object URL)
                  setOcrLoading(true)
                  setOcrProgress(0)
                  const worker = await createWorker()
                  try {
                    // createWorker resolves after loading & initializing languages, so we can call recognize directly
                    const { data } = await worker.recognize(file)
                    console.log('Tesseract result', data)
                    const text = (data && data.text) ? data.text.trim() : ''
                    setOcrText(text || 'No text recognized — try a clearer photo or different lighting.')
                  } catch (err) {
                    console.error('OCR error', err)
                    setOcrText('OCR failed: ' + ((err as any)?.message ?? String(err)))
                  } finally {
                    setOcrLoading(false)
                    setOcrProgress(100)
                    await worker.terminate()
                    try { URL.revokeObjectURL(url) } catch (e) { /* ignore */ }
                  }
                }} />
                <label className="primary-btn" htmlFor="scanner-file">Upload / Capture Image</label>
                <button className="primary-btn" onClick={async () => {
                  const isMobile = /(Mobi|Android|iPhone|iPad|iPod)/i.test(navigator.userAgent) || (navigator as any).maxTouchPoints > 0
                  if (isMobile) {
                    // On mobile, prefer the native file input with back camera
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    // request back camera on mobile
                    input.capture = 'environment'
                    input.onchange = async (ev: any) => {
                      const file = ev.target.files?.[0]
                      if (!file) return
                      const url = URL.createObjectURL(file)
                      setImageSrc(url)
                      setOcrText('')
                      setOcrLoading(true)
                      setOcrProgress(0)
                      const worker = await createWorker()
                      try {
                        const { data } = await worker.recognize(file)
                        const text = (data && data.text) ? data.text.trim() : ''
                        setOcrText(text || 'No text recognized — try a clearer photo or different lighting.')
                      } catch (err) {
                        console.error('OCR error', err)
                        setOcrText('OCR failed: ' + ((err as any)?.message ?? String(err)))
                      } finally {
                        setOcrLoading(false)
                        setOcrProgress(100)
                        await worker.terminate()
                        try { URL.revokeObjectURL(url) } catch (e) { /* ignore */ }
                      }
                    }
                    input.click()
                  } else {
                    // On desktop, open camera via getUserMedia and use front camera
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                      setCameraStream(stream)
                      setCameraActive(true)
                      // attach stream to video element when available
                      setTimeout(() => {
                        if (videoRef.current) {
                          videoRef.current.srcObject = stream
                          videoRef.current.play().catch(() => {})
                        }
                      }, 50)
                    } catch (err) {
                      console.error('Camera open failed', err)
                      // fallback to file input if getUserMedia fails
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async (ev: any) => {
                        const file = ev.target.files?.[0]
                        if (!file) return
                        const url = URL.createObjectURL(file)
                        setImageSrc(url)
                        setOcrText('')
                        setOcrLoading(true)
                        setOcrProgress(0)
                        const worker = await createWorker()
                        try {
                          const { data } = await worker.recognize(file)
                          const text = (data && data.text) ? data.text.trim() : ''
                          setOcrText(text || 'No text recognized — try a clearer photo or different lighting.')
                        } catch (err) {
                          console.error('OCR error', err)
                          setOcrText('OCR failed: ' + ((err as any)?.message ?? String(err)))
                        } finally {
                          setOcrLoading(false)
                          setOcrProgress(100)
                          await worker.terminate()
                          try { URL.revokeObjectURL(url) } catch (e) { /* ignore */ }
                        }
                      }
                      input.click()
                    }
                  }
                }}>Use Camera</button>
              </div>

              <div className="scanner-result">
                {imageSrc && <img src={imageSrc} alt="preview" className="ocr-preview" />}
                {cameraActive && (
                  <div className="camera-preview">
                    <video ref={videoRef} autoplay playsInline muted />
                    <div style={{ marginTop: 8 }}>
                      <button className="primary-btn" onClick={async () => {
                        if (!videoRef.current) return
                        const video = videoRef.current
                        const canvas = document.createElement('canvas')
                        canvas.width = video.videoWidth || 1280
                        canvas.height = video.videoHeight || 720
                        const ctx = canvas.getContext('2d')
                        if (!ctx) return
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        canvas.toBlob(async (blob) => {
                          if (!blob) return
                          const file = new File([blob], 'capture.jpg', { type: blob.type })
                          const url = URL.createObjectURL(file)
                          setImageSrc(url)
                          setOcrText('')
                          setOcrLoading(true)
                          setOcrProgress(0)
                          // stop camera
                          try { cameraStream?.getTracks().forEach(t => t.stop()) } catch (e) { /* ignore */ }
                          setCameraActive(false)
                          setCameraStream(null)
                          const worker = await createWorker()
                          try {
                            const { data } = await worker.recognize(file)
                            const text = (data && data.text) ? data.text.trim() : ''
                            setOcrText(text || 'No text recognized — try a clearer photo or different lighting.')
                          } catch (err) {
                            console.error('OCR error', err)
                            setOcrText('OCR failed: ' + ((err as any)?.message ?? String(err)))
                          } finally {
                            setOcrLoading(false)
                            setOcrProgress(100)
                            await worker.terminate()
                            try { URL.revokeObjectURL(url) } catch (e) { /* ignore */ }
                          }
                        }, 'image/jpeg')
                      }}>Capture</button>
                      <button className="link-btn" onClick={() => {
                        try { cameraStream?.getTracks().forEach(t => t.stop()) } catch (e) { /* ignore */ }
                        setCameraActive(false)
                        setCameraStream(null)
                      }}>Close Camera</button>
                    </div>
                  </div>
                )}
                    <div className="ocr-output">
                      {ocrLoading && <div className="progress-bar"><div className="progress-fill" style={{ width: `${ocrProgress}%` }} /></div>}
                      <textarea readOnly value={ocrText} placeholder="OCR result will appear here..." />
                    </div>
                    {ocrLoading && (
                      <div className="scanner-loading-overlay" onClick={(e) => e.stopPropagation()}>
                        <Loader />
                      </div>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
