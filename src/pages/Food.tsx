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
  const initialAiInsight = (location.state as any)?.ai_insight || null
  const [parsed, setParsed] = useState<any>(initial)
  const [loading, setLoading] = useState<boolean>(false)

  function formatAiInsightValue(val: any) {
    if (!val) return null
    if (typeof val === 'string') return val
    try {
      const nf = val.nutrition_facts || val.nutritionFacts || {}
      const lines: string[] = []
      if (nf && Object.keys(nf).length > 0) {
        lines.push('Nutrition Summary:')
        const map = [
          ['Energy (kcal)', nf.energy_kcal_per_serving ?? nf.calories ?? nf.calories_per_serving],
          ['Protein (g)', nf.protein_g_per_100g ?? nf.protein_g ?? nf.protein_g_per_serving ?? nf.protein_g],
          ['Carbohydrate (g)', nf.carbohydrate_g_per_100g ?? nf.total_carbohydrate_g ?? nf.carbohydrate_g],
          ['Total sugars (g)', nf.total_sugars_g_per_100g ?? nf.sugars_g],
          ['Fiber (g)', nf.fiber_g_per_100g ?? nf.dietary_fiber_g],
          ['Total fat (g)', nf.total_fat_g ?? nf.total_fat],
          ['Saturated fat (g)', nf.saturated_fat_g ?? nf.saturated_fat],
          ['Trans fat (g)', nf.trans_fat_g ?? nf.trans_fat_g_per_serving ?? nf.trans_fat],
        ]
        for (const [label, value] of map) {
          if (value !== null && value !== undefined) lines.push(`${label}: ${value}`)
        }
      }
      if (val.cleaned_text) {
        lines.push('')
        lines.push('Detected Text:')
        lines.push(val.cleaned_text)
      }
      if (Array.isArray(val.medical_nutrition_advice) && val.medical_nutrition_advice.length) {
        lines.push('')
        lines.push('Medical Nutrition Advice:')
        val.medical_nutrition_advice.slice(0,5).forEach((a: any) => {
          if (typeof a === 'string') lines.push(`- ${a}`)
          else if (a && a.condition && a.advice) lines.push(`- ${a.condition}: ${a.advice}`)
        })
      }
      if (lines.length === 0) return JSON.stringify(val, null, 2)
      return lines.join('\n')
    } catch (e) {
      try { return JSON.stringify(val, null, 2) } catch { return String(val) }
    }
  }

  const [aiInsight, setAiInsight] = useState<string | null>(formatAiInsightValue(initialAiInsight))

  const API_BASE = (import.meta.env.VITE_AI_API_BASE as string) || 'https://poshanix.onrender.com'

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
            if (!cancelled) {
              setParsed(data)
              // capture any free-form AI insight text if provided in response
              if (data && (data.ai_insight || data.ai_text || data.advice_text || data.assistant_text)) {
                const raw = data.ai_insight || data.ai_text || data.advice_text || data.assistant_text
                setAiInsight(formatAiInsightValue(raw))
              }
            }
        } else {
          const text = await res.text()
          // treat plain text as an advice item
          const next = { ...parsed, medical_nutrition_advice: [ { condition: 'AI', advice: text.trim() } ] }
          if (!cancelled) {
            setParsed(next)
            setAiInsight(text.trim())
          }
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

  function extractAllergens(text: string | null, ingredientsList: any) {
    const found: string[] = []
    if (typeof text === 'string') {
      const m = text.match(/ALLERGEN\s*ADVICE[:\-]?\s*([^\.\n]+)/i)
      if (m && m[1]) found.push(m[1].trim())
    }
    if (Array.isArray(ingredientsList)) {
      const ingText = ingredientsList.join(' ').toLowerCase()
      const common = ['milk','egg','peanut','soy','wheat','tree nut','almond','cashew','fish','shellfish','sesame']
      for (const c of common) if (ingText.includes(c) && !found.find(f=>f.toLowerCase().includes(c))) found.push(c.charAt(0).toUpperCase()+c.slice(1))
    }
    return found.length ? found.join(', ') : 'None detected'
  }

  function extractClinicalNotes(parsedAdvice: any[], aiText: string | null) {
    const notes: string[] = []
    if (Array.isArray(parsedAdvice) && parsedAdvice.length) {
      parsedAdvice.forEach((a) => {
        if (typeof a === 'string') notes.push(a)
        else if (a && a.advice) notes.push(a.advice)
      })
    }
    if (aiText && typeof aiText === 'string') {
      const idx = aiText.indexOf('Medical Nutrition Advice:')
      if (idx !== -1) {
        const part = aiText.slice(idx + 'Medical Nutrition Advice:'.length)
        const lines = part.split('\n').map(s=>s.trim()).filter(Boolean)
        for (const l of lines) {
          if (l.startsWith('-')) notes.push(l.replace(/^[-\d\.\)\s]*/,'').replace(/^\s*-\s*/,'').trim())
          else if (l.length > 0 && notes.length < 10) notes.push(l.replace(/^[-\d\.\)\s]*/,'').trim())
        }
      }
    }
    // de-duplicate
    return Array.from(new Set(notes)).slice(0, 10)
  }

  const cardAllergens = extractAllergens(parsed.cleaned_text ?? null, ingredients)
  const clinicalNotes = extractClinicalNotes(advice, aiInsight)

  // compact metrics for card
  function getMetric(key: string) {
    // try multiple shapes
    const per100 = nf.per_100g ?? nf.per100g ?? nf.per100 ?? nf
    return per100 ? (per100[key] ?? per100[`${key}_g`] ?? per100[`${key}_mg`] ?? per100[`${key}_kcal`]) : undefined
  }
  const energy100 = getMetric('energy_kcal') ?? getMetric('energy') ?? getMetric('calories')
  const protein100 = getMetric('protein') ?? getMetric('protein_g')
  const carbs100 = getMetric('carbohydrates') ?? getMetric('carbohydrates_g') ?? getMetric('carbohydrate_g')
  const satFat100 = getMetric('saturated_fat') ?? getMetric('saturated_fat_g') ?? getMetric('saturatedFat')

  function getNutrientValue(nfObj: any, nutrientKey: string) {
    // Try to read per-100g values and per-serving values
    if (!nfObj) return { per100: undefined, perServe: undefined }
    const per100 = nfObj.per_100g ?? nfObj.per100g ?? nfObj.per100 ?? nfObj
    const servingSize = nfObj.serving_size_g ?? nfObj.serving_size ?? nfObj.servingSizeG ?? nfObj.serving_size_g

    const raw100 = per100 ? (per100[nutrientKey] ?? per100[`${nutrientKey}_g`] ?? per100[`${nutrientKey}_mg`] ?? per100[`${nutrientKey}_kcal`] ?? per100[`${nutrientKey}s`] ) : undefined
    // per serving: prefer explicit per-serving fields, else compute from per100 and serving size
    const rawServe = nfObj[`${nutrientKey}_per_serving`] ?? nfObj[`${nutrientKey}_per_serve`] ?? nfObj[`${nutrientKey}_perserving`]
      ?? (raw100 !== undefined && servingSize ? (Number(raw100) * Number(servingSize) / 100) : undefined)
    return { per100: raw100, perServe: rawServe }
  }

  const combinedNotes = (() => {
    const norm: string[] = []
    if (Array.isArray(advice)) {
      advice.forEach((a) => {
        if (typeof a === 'string') norm.push(a)
        else if (a && a.advice) norm.push(a.advice)
      })
    }
    // normalize notes to remove repetitive prefixes
    function normalizeNote(s: string) {
      if (!s) return s
      return s.replace(/^\s*(This product (provides|contains)|The product contains|One serving provides|Individuals with|Individuals who|This product has)[:\s-]*/i, '').trim()
    }
    clinicalNotes.forEach(n => { if (n) {
      const nn = normalizeNote(n)
      if (!norm.includes(nn)) norm.push(nn)
    } })
    return norm
  })()

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

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            {/* left: existing nutrition table will follow in sections */}
          </div>
          <div style={{ width: 280 }}>
            <div style={{ padding: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, background: '#fff' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Quick Nutrition Card</div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <div><strong>Energy (per 100g):</strong> {energy100 ?? '—'}</div>
                <div><strong>Protein (per 100g):</strong> {protein100 ?? '—'}</div>
                <div><strong>Carbs (per 100g):</strong> {carbs100 ?? '—'}</div>
                <div><strong>Saturated Fat (per 100g):</strong> {satFat100 ?? '—'}</div>
                <div style={{ marginTop: 8 }}><strong>Allergens:</strong> {cardAllergens}</div>
              </div>
            </div>
          </div>
        </div>

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
          ) : combinedNotes.length > 0 ? (
            <ul>
              {combinedNotes.slice(0,10).map((note: string, i: number) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : (<div>No clinical observations provided.</div>)}

          {/* If an AI insight string is available (from Home or OCR text), show it here */}
          {aiInsight ? (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,0,0,0.04)', borderRadius: 8 }}>
              <strong>AI Insight:</strong>
              <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
            </div>
          ) : null}
        </section>

        <div style={{ marginTop: 24 }}>
          <button className="primary-btn" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </main>
    </div>
  )
}
