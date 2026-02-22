import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/useTheme'
import ThemeSwitch from '../components/Switch'
import Loader from '../components/loader'
import './Profile.css'

type WeightUnit = 'kg' | 'lbs'
type HeightUnit = 'cm' | 'ft'
type Gender = 'male' | 'female' | ''
type WaterIntake = '1-2L' | '2-3L' | '3L+' | ''
type EatingHabits = '1_meal' | '2_meals' | '3_meals' | '3+_meals' | ''
type WorkoutLevel = 'none' | 'moderate' | 'high' | ''

interface ProfileData {
  full_name: string
  email: string
  age: string
  gender: Gender
  weight: string
  weight_unit: WeightUnit
  height: string
  height_unit: HeightUnit
  water_intake: WaterIntake
  eating_habits: EatingHabits
  food_allergies: string
  workout_level: WorkoutLevel
  has_medical_history: boolean | null
  medical_doc_url: string
  avatar_url: string
  bmi: number | null
  bmr: number | null
}

const EMPTY: ProfileData = {
  full_name: '', email: '', age: '', gender: '', weight: '',
  weight_unit: 'kg', height: '', height_unit: 'cm', water_intake: '', eating_habits: '',
  food_allergies: '', workout_level: '', has_medical_history: null,
  medical_doc_url: '', avatar_url: '', bmi: null, bmr: null,
}

/* ---------- BMI/BMR Calculation Helpers ---------- */
function calculateBMI(weight: string, weightUnit: WeightUnit, height: string, heightUnit: HeightUnit): number | null {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || w <= 0 || h <= 0) return null

  // Convert to kg and meters
  const weightKg = weightUnit === 'lbs' ? w * 0.453592 : w
  const heightM = heightUnit === 'ft' ? h * 0.3048 : h / 100

  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

function calculateBMR(weight: string, weightUnit: WeightUnit, height: string, heightUnit: HeightUnit, age: string, gender: Gender): number | null {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  const a = parseInt(age)
  if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0 || !gender) return null

  // Convert to kg and cm
  const weightKg = weightUnit === 'lbs' ? w * 0.453592 : w
  const heightCm = heightUnit === 'ft' ? h * 30.48 : h

  // Mifflin-St Jeor Equation
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * a
  bmr += gender === 'male' ? 5 : -161

  return Math.round(bmr)
}

function Profile() {
  const navigate = useNavigate()
  const [theme, toggleTheme] = useTheme()

  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileData>(EMPTY)
  const [original, setOriginal] = useState<ProfileData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [newMedicalFile, setNewMedicalFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  /* ---------- load ---------- */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { navigate('/auth'); return }
      const uid = data.user.id
      setUserId(uid)

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      const filled: ProfileData = {
        full_name:          p?.full_name        ?? data.user.user_metadata?.full_name ?? '',
        email:              p?.email            ?? data.user.email ?? '',
        age:                p?.age              != null ? String(p.age) : '',
        gender:             p?.gender           ?? '',
        weight:             p?.weight           != null ? String(p.weight) : '',
        weight_unit:        p?.weight_unit      ?? 'kg',
        height:             p?.height           != null ? String(p.height) : '',
        height_unit:        p?.height_unit      ?? 'cm',
        water_intake:       p?.water_intake     ?? '',
        eating_habits:      p?.eating_habits    ?? '',
        food_allergies:     p?.food_allergies   ?? '',
        workout_level:      p?.workout_level    ?? '',
        has_medical_history: p?.has_medical_history ?? null,
        medical_doc_url:    p?.medical_doc_url  ?? '',
        avatar_url:         p?.avatar_url       ?? data.user.user_metadata?.avatar_url ?? '',
        bmi:                p?.bmi              ?? null,
        bmr:                p?.bmr              ?? null,
      }
      setForm(filled)
      setOriginal(filled)
      setLoading(false)
    })
  }, [navigate])

  const set = <K extends keyof ProfileData>(key: K, val: ProfileData[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  /* ---------- save ---------- */
  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setError('')
    setSuccess(false)

    let docUrl = form.medical_doc_url

    if (newMedicalFile) {
      setUploadingDoc(true)
      const ext = newMedicalFile.name.split('.').pop()
      const path = `${userId}/medical_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('medical-docs')
        .upload(path, newMedicalFile, { upsert: true })
      setUploadingDoc(false)
      if (upErr) {
        console.warn('Upload failed:', upErr.message)
      } else {
        const { data: urlData } = supabase.storage
          .from('medical-docs')
          .getPublicUrl(path)
        docUrl = urlData.publicUrl
      }
    }

    // Calculate BMI and BMR
    const bmi = calculateBMI(form.weight, form.weight_unit, form.height, form.height_unit)
    const bmr = calculateBMR(form.weight, form.weight_unit, form.height, form.height_unit, form.age, form.gender)

    setSaving(true)
    const { error: dbErr } = await supabase.from('profiles').update({
      full_name:           form.full_name.trim() || null,
      age:                 form.age ? Number(form.age) : null,
      gender:              form.gender || null,
      weight:              form.weight ? Number(form.weight) : null,
      weight_unit:         form.weight_unit,
      height:              form.height ? Number(form.height) : null,
      height_unit:         form.height_unit,
      bmi:                 bmi,
      bmr:                 bmr,
      water_intake:        form.water_intake || null,
      eating_habits:       form.eating_habits || null,
      food_allergies:      form.food_allergies.trim() || null,
      workout_level:       form.workout_level || null,
      has_medical_history: form.has_medical_history,
      medical_doc_url:     docUrl || null,
    }).eq('id', userId)

    // Sync name into auth user_metadata so it reflects everywhere (nav, greeting, initials)
    if (!dbErr && form.full_name.trim()) {
      await supabase.auth.updateUser({
        data: { full_name: form.full_name.trim() },
      })
    }

    setSaving(false)

    if (dbErr) {
      setError('Failed to save: ' + dbErr.message)
    } else {
      const updatedForm = { ...form, medical_doc_url: docUrl, bmi, bmr }
      setForm(updatedForm)
      setOriginal(updatedForm)
      setNewMedicalFile(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(original) || !!newMedicalFile

  const initials = (form.full_name || form.email || '?').slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Nav */}
      <nav className="nav profile-nav">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <span className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          &#x1F33F; Poshanix
        </span>
        <ThemeSwitch checked={theme === 'dark'} onToggle={toggleTheme} />
      </nav>

      <main className="profile-container">
        <form className="profile-card" onSubmit={handleSave}>

          {/* Header / Avatar */}
          <div className="profile-header">
            <div className="profile-avatar-wrap">
              {form.avatar_url
                ? <img src={form.avatar_url} className="profile-avatar-img" alt="avatar" />
                : <div className="profile-avatar-initials">{initials}</div>}
            </div>
            <div>
              <h1 className="profile-name">{form.full_name || form.email || 'Your Profile'}</h1>
              <p className="profile-email">{form.email}</p>
            </div>
          </div>

          {error   && <div className="profile-error">{error}</div>}
          {success && (
            <div className="profile-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Profile saved successfully!
            </div>
          )}

          {/* ---- Health Metrics ---- */}
          {(form.bmi !== null || form.bmr !== null) && (
            <div className="health-metrics">
              {form.bmi !== null && (
                <div className="metric-card">
                  <div className="metric-icon">📊</div>
                  <div className="metric-info">
                    <div className="metric-label">BMI</div>
                    <div className="metric-value">{form.bmi}</div>
                    <div className="metric-category">
                      {form.bmi < 18.5 ? 'Underweight' : 
                       form.bmi < 25 ? 'Normal' : 
                       form.bmi < 30 ? 'Overweight' : 'Obese'}
                    </div>
                  </div>
                </div>
              )}
              {form.bmr !== null && (
                <div className="metric-card">
                  <div className="metric-icon">🔥</div>
                  <div className="metric-info">
                    <div className="metric-label">BMR</div>
                    <div className="metric-value">{form.bmr}</div>
                    <div className="metric-category">kcal/day</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Section: Basic Info ---- */}
          <div className="profile-section">
            <h2 className="section-title">
              <span>👤</span> Basic Info
            </h2>

            {/* Name — prominent first field, full width */}
            <div className="field-group name-field-group">
              <label className="field-label name-label"> Your Name <span className="name-hint">(shows across the app)</span></label>
              <input
                className="profile-input profile-input-name"
                type="text"
                placeholder="e.g. Alex"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="field-grid">
              <div className="field-group">
                <label className="field-label">Email</label>
                <input
                  className="profile-input"
                  type="email"
                  value={form.email}
                  disabled
                  title="Email cannot be changed here"
                />
              </div>
              <div className="field-group">
                <label className="field-label"> Age</label>
                <input
                  className="profile-input"
                  type="number"
                  placeholder="e.g. 25"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                />
              </div>
              <div className="field-group">
                <label className="field-label"> Gender</label>
                <div className="chip-group">
                  <button type="button"
                    className={`chip ${form.gender === 'male' ? 'chip-active' : ''}`}
                    onClick={() => set('gender', 'male')}>♂️ Male</button>
                  <button type="button"
                    className={`chip ${form.gender === 'female' ? 'chip-active' : ''}`}
                    onClick={() => set('gender', 'female')}>♀️ Female</button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label"> Weight</label>
                <div className="weight-row">
                  <input
                    className="profile-input weight-input"
                    type="number"
                    placeholder="e.g. 70"
                    step="0.1"
                    min={1}
                    value={form.weight}
                    onChange={e => set('weight', e.target.value)}
                  />
                  <div className="unit-toggle">
                    <button type="button" className={`unit-btn ${form.weight_unit === 'kg' ? 'unit-active' : ''}`} onClick={() => set('weight_unit', 'kg')}>kg</button>
                    <button type="button" className={`unit-btn ${form.weight_unit === 'lbs' ? 'unit-active' : ''}`} onClick={() => set('weight_unit', 'lbs')}>lbs</button>
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label"> Height</label>
                <div className="weight-row">
                  <input
                    className="profile-input weight-input"
                    type="number"
                    placeholder={form.height_unit === 'cm' ? 'e.g. 175' : 'e.g. 5.9'}
                    step={form.height_unit === 'cm' ? '1' : '0.1'}
                    min={1}
                    value={form.height}
                    onChange={e => set('height', e.target.value)}
                  />
                  <div className="unit-toggle">
                    <button type="button" className={`unit-btn ${form.height_unit === 'cm' ? 'unit-active' : ''}`} onClick={() => set('height_unit', 'cm')}>cm</button>
                    <button type="button" className={`unit-btn ${form.height_unit === 'ft' ? 'unit-active' : ''}`} onClick={() => set('height_unit', 'ft')}>ft</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Section: Diet & Hydration ---- */}
          <div className="profile-section">
            <h2 className="section-title">
              <span></span> Diet &amp; Hydration
            </h2>

            <label className="field-label"> Daily Water Intake</label>
            <div className="chip-group">
              {([
                { value: '1-2L', label: '1–2 L',  icon: '' },
                { value: '2-3L', label: '2–3 L',  icon: '' },
                { value: '3L+',  label: '3 L+',   icon: '' },
              ] as { value: WaterIntake; label: string; icon: string }[]).map(opt => (
                <button key={opt.value} type="button"
                  className={`chip ${form.water_intake === opt.value ? 'chip-active' : ''}`}
                  onClick={() => set('water_intake', opt.value)}>
                  <span className="chip-icon">{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>

            <label className="field-label" style={{ marginTop: '0.85rem' }}> Eating Habits</label>
            <div className="chip-group">
              {([
                { value: '1_meal',   label: '1 Meal',   icon: '' },
                { value: '2_meals',  label: '2 Meals',  icon: '' },
                { value: '3_meals',  label: '3 Meals',  icon: '' },
                { value: '3+_meals', label: '3+ Meals', icon: '' },
              ] as { value: EatingHabits; label: string; icon: string }[]).map(opt => (
                <button key={opt.value} type="button"
                  className={`chip ${form.eating_habits === opt.value ? 'chip-active' : ''}`}
                  onClick={() => set('eating_habits', opt.value)}>
                  <span className="chip-icon">{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Section: Health ---- */}
          <div className="profile-section">
            <h2 className="section-title">
              <span>🏥</span> Health
            </h2>

            <label className="field-label"> Food Allergies</label>
            <textarea
              className="profile-input profile-textarea"
              placeholder="e.g. peanuts, shellfish, gluten …"
              rows={3}
              value={form.food_allergies}
              onChange={e => set('food_allergies', e.target.value)}
            />

            <label className="field-label" style={{ marginTop: '0.85rem' }}>📋 Prior Medical History</label>
            <div className="chip-group">
              <button type="button"
                className={`chip ${form.has_medical_history === true ? 'chip-active' : ''}`}
                onClick={() => set('has_medical_history', true)}>Yes</button>
              <button type="button"
                className={`chip ${form.has_medical_history === false ? 'chip-active' : ''}`}
                onClick={() => set('has_medical_history', false)}>No</button>
            </div>

            {form.has_medical_history && (
              <div className="upload-area" style={{ marginTop: '0.75rem' }}>
                <label className={`upload-label ${newMedicalFile || form.medical_doc_url ? 'has-file' : ''}`} htmlFor="prof-med-file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {newMedicalFile
                    ? newMedicalFile.name
                    : form.medical_doc_url
                      ? 'Document uploaded — click to replace'
                      : 'Upload medical documents'}
                </label>
                <input id="prof-med-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={e => setNewMedicalFile(e.target.files?.[0] ?? null)} />
              </div>
            )}
          </div>

          {/* ---- Section: Fitness ---- */}
          <div className="profile-section">
            <h2 className="section-title">
              <span></span> Fitness
            </h2>
            <label className="field-label">Workout Level</label>
            <div className="chip-group">
              {([
                { value: 'none',     label: 'None',     icon: '🚶' },
                { value: 'moderate', label: 'Moderate', icon: '🏃' },
                { value: 'high',     label: 'High',     icon: '🏋️' },
              ] as { value: WorkoutLevel; label: string; icon: string }[]).map(opt => (
                <button key={opt.value} type="button"
                  className={`chip ${form.workout_level === opt.value ? 'chip-active' : ''}`}
                  onClick={() => set('workout_level', opt.value)}>
                  <span className="chip-icon">{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Save Bar ---- */}
          <div className="profile-actions">
            <button type="button" className="discard-btn"
              disabled={!isDirty || saving}
              onClick={() => { setForm(original); setNewMedicalFile(null); setError('') }}>
              Discard Changes
            </button>
            <button type="submit" className={`save-btn ${isDirty ? 'save-active' : ''}`}
              disabled={!isDirty || saving || uploadingDoc}>
              {saving || uploadingDoc
                ? <><span className="save-spinner" /> Saving…</>
                : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Save Changes
                  </>}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}

export default Profile
