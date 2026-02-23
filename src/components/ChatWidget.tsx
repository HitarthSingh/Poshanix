import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './ChatWidget.css'

const API_BASE = (import.meta.env.VITE_AI_API_BASE as string) || 'https://poshanix.onrender.com'

interface UserProfile {
  age?: number
  gender?: string
  weight?: number
  weight_unit?: string
  height?: number
  height_unit?: string
  bmi?: number
  bmr?: number
  water_intake?: string
  eating_habits?: string
  food_allergies?: string
  workout_level?: string
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('age, gender, weight, weight_unit, height, height_unit, bmi, bmr, water_intake, eating_habits, food_allergies, workout_level')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    }
    loadProfile()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          userProfile: userProfile 
        })
      })
      
      // Handle different API response formats
      let aiResponse = ''
      
      // Check if response is plain text
      const contentType = res.headers.get('content-type')
      if (contentType?.includes('text/plain')) {
        aiResponse = await res.text()
      } else {
        const data = await res.json()
         if (data?.response) {
          aiResponse = data.response
        }
        // Google Gemini format: candidates[0].content.parts[0].text
        else if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiResponse = data.candidates[0].content.parts[0].text
        }
        // OpenAI format: choices[0].message.content
        else if (data?.choices?.[0]?.message?.content) {
          aiResponse = data.choices[0].message.content
        }
        // Fallback to error message in data
        else if (data?.error) {
          aiResponse = `Error: ${data.error.message || String(data.error)}`
        }
        // Last resort
        else {
          aiResponse = 'Sorry, I received an unexpected response format. Please try again.'
        }
      }
      
      setMessages(m => [...m, { role: 'assistant', content: aiResponse }])
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error contacting AI: ' + String(err) }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={`chat-widget ${open ? 'chat-open' : ''}`}>
      <button 
        className="chat-toggle" 
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="chat-badge">AI</span>
          </>
        )}
      </button>
      
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">🤖</div>
              <div>
                <h3 className="chat-title">Nutrition Assistant</h3>
                <p className="chat-status">Powered by AI</p>
              </div>
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">💬</div>
                <p className="chat-empty-text">Ask me anything about nutrition, diet, or health!</p>
                <div className="chat-suggestions">
                  <button className="suggestion-chip" onClick={() => setInput('How many calories should I eat daily?')}>Daily calories</button>
                  <button className="suggestion-chip" onClick={() => setInput('What are good protein sources?')}>Protein sources</button>
                  <button className="suggestion-chip" onClick={() => setInput('Explain macronutrients')}>Macronutrients</button>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg-wrapper ${m.role}`}>
                <div className={`chat-msg ${m.role}`}>
                  {m.role === 'assistant' && <span className="msg-icon">🤖</span>}
                  <span className="msg-content">{m.content}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg-wrapper assistant">
                <div className="chat-msg assistant typing">
                  <span className="msg-icon">🤖</span>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-wrapper">
            <div className="chat-input">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..." 
                disabled={loading}
              />
              <button 
                className="send-btn" 
                onClick={send} 
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                {loading ? (
                  <div className="spinner-small"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
