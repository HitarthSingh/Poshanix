import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Loader from '../components/loader'
import './Home.css'

function formatNumber(n: any) {
  return n === null || n === undefined ? '—' : String(n)
}

export default function Food() {
  const location = useLocation()
  const navigate = useNavigate()
  const initial = (location.state as any)?.parsed || null
  const [parsed, setParsed] = useState<any>(initial)
  const [loading, setLoading] = useState<boolean>(false)

  const API_BASE = (import.meta.env.VITE_AI_API_BASE as string) || 'http://localhost:3001'

  useEffect(() => {
    // If we have only OCR cleaned_text and no nutrition_facts, request parsing from backend
    if (!parsed || !parsed.cleaned_text) return
    const nf = parsed.nutrition_facts || {}
    if (nf && Object.keys(nf).length > 0) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/gemini/ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: parsed.cleaned_text })
        })

        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (!cancelled) setParsed(data)
        } else {
          const text = await res.text()
          // treat plain text as an advice item
          const next = { ...parsed, medical_nutrition_advice: [ { condition: 'AI', advice: text.trim() } ] }
          if (!cancelled) setParsed(next)
        }
      } catch (e) {
        console.error('Food parse error', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [parsed])

  if (!parsed) {
    return (
      <div className="page">
        <nav className="nav">
          <span className="nav-logo">🍽️ Poshanix</span>
        </nav>
        <main style={{ padding: 24 }}>
          <h2>No food data</h2>
          <p>No parsed nutrition data was provided. Scan a food label first.</p>
          <button className="primary-btn" onClick={() => navigate('/home')}>Go back</button>
        </main>
      </div>
    )
  }

  const nf = parsed.nutrition_facts || {}
  const ingredients = parsed.ingredients || null
  const advice = parsed.medical_nutrition_advice || []
  const healthScore = parsed.health_score ?? parsed.healthScore ?? null

  return (
    <div className="page">
      <nav className="nav">
        <span className="nav-logo">🍽️ Poshanix</span>
      </nav>

      <main style={{ padding: 24 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Food Analysis (AI)</h2>
            <div style={{ color: '#666' }}>Displayed results are produced by the AI parser, not raw OCR.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Health Score</div>
            <div style={{ fontSize: 28 }}>{healthScore ?? '—'}</div>
          </div>
        </header>

        <section style={{ marginTop: 20 }}>
          <h3>Nutrition Facts (from AI)</h3>
          {loading ? (
            <div style={{ padding: 24 }}><Loader /></div>
          ) : (
            <table className="nf-table">
              <tbody>
                <tr><td>Serving Size</td><td>{nf.serving_size ?? '—'}</td></tr>
                <tr><td>Servings Per Container</td><td>{formatNumber(nf.servings_per_container)}</td></tr>
                <tr><td>Calories</td><td>{formatNumber(nf.calories)}</td></tr>
                <tr><td>Total Fat (g)</td><td>{formatNumber(nf.total_fat_g)}</td></tr>
                <tr><td>Saturated Fat (g)</td><td>{formatNumber(nf.saturated_fat_g)}</td></tr>
                <tr><td>Trans Fat (g)</td><td>{formatNumber(nf.trans_fat_g)}</td></tr>
                <tr><td>Cholesterol (mg)</td><td>{formatNumber(nf.cholesterol_mg)}</td></tr>
                <tr><td>Sodium (mg)</td><td>{formatNumber(nf.sodium_mg)}</td></tr>
                <tr><td>Potassium (mg)</td><td>{formatNumber(nf.potassium_mg)}</td></tr>
                <tr><td>Total Carbohydrate (g)</td><td>{formatNumber(nf.total_carbohydrate_g)}</td></tr>
                <tr><td>Dietary Fiber (g)</td><td>{formatNumber(nf.dietary_fiber_g)}</td></tr>
                <tr><td>Sugars (g)</td><td>{formatNumber(nf.sugars_g)}</td></tr>
                <tr><td>Protein (g)</td><td>{formatNumber(nf.protein_g)}</td></tr>
              </tbody>
            </table>
          )}
        </section>

        <section style={{ marginTop: 20 }}>
          <h3>Ingredients (from AI)</h3>
          {loading ? <div /> : (
            Array.isArray(ingredients) ? (
              <ul>
                {ingredients.map((ing: string, i: number) => <li key={i}>{ing}</li>)}
              </ul>
            ) : (<div>{ingredients ?? 'Not provided'}</div>)
          )}
        </section>

        <section style={{ marginTop: 20 }}>
          <h3>Medical & Nutrition Observations (from AI)</h3>
          {loading ? (
            <div style={{ padding: 12 }}>Analyzing...</div>
          ) : Array.isArray(advice) && advice.length > 0 ? (
            <ul>
              {advice.slice(0,5).map((a: any, i: number) => (
                <li key={i}><strong>{a.condition}:</strong> {a.advice}</li>
              ))}
            </ul>
          ) : (<div>No clinical observations provided.</div>)}
        </section>

        <div style={{ marginTop: 24 }}>
          <button className="primary-btn" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </main>
    </div>
  )
}
