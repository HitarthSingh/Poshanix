import React, { useEffect, useState } from 'react'
import './RotatingText.css'

interface RotatingTextProps {
  texts: string[]
  splitBy?: 'words' | 'chars'
  rotationInterval?: number
  staggerDuration?: number
  mainClassName?: string
}

export default function RotatingText({
  texts,
  splitBy = 'words',
  rotationInterval = 2200,
  staggerDuration = 30,
  mainClassName = ''
}: RotatingTextProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!texts || texts.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % texts.length), rotationInterval)
    return () => clearInterval(t)
  }, [texts, rotationInterval])

  const current = texts && texts.length ? texts[index] : ''

  const lines = (current || '').split(/\n/) || ['']

  return (
    <span className={`text-rotate ${mainClassName}`} aria-hidden="true">
      <span className="text-rotate-lines">
        {lines.map((line, li) => (
          <span key={li} className="text-rotate-word" style={{ display: 'inline-flex' }}>
            {splitBy === 'chars'
              ? Array.from(line).map((ch, ci) => (
                  <span key={ci} className="text-rotate-element" style={{ transitionDelay: `${ci * staggerDuration}ms` }}>{ch}</span>
                ))
              : line.split(/(\s+)/).map((word, wi) => (
                  // preserve spaces
                  word.match(/^\s+$/) ? (
                    <span key={wi} className="text-rotate-space">{word}</span>
                  ) : (
                    <span key={wi} className="text-rotate-element" style={{ transitionDelay: `${wi * staggerDuration}ms` }}>{word}</span>
                  )
                ))}
          </span>
        ))}
      </span>
      <span className="text-rotate-sr-only">{current}</span>
    </span>
  )
}
