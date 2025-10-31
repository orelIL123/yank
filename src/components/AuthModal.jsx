import React, { useMemo, useState, useEffect } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'

export default function AuthModal({ open, onClose, defaultMode = 'sign-in' }) {
  const [mode, setMode] = useState(defaultMode)

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode, open])

  const appearance = useMemo(
    () => ({
      elements: {
        formButtonPrimary: 'bg-[#D4AF37] hover:bg-[#c7a22e] text-black',
        card: 'bg-[#0b1b3a] border border-white/10 shadow-xl',
        headerTitle: 'text-white',
        headerSubtitle: 'text-white/70',
        socialButtonsBlockButton: 'bg-white/10 hover:bg-white/20 text-white',
        dividerLine: 'bg-white/10',
        footer: 'text-white/70',
        formFieldLabel: 'text-white/80',
        formFieldInput: 'bg-white/5 border-white/10 text-white placeholder-white/40',
        formFieldInputShowPasswordButton: 'text-white/70',
        formResendCodeLink: 'text-[#D4AF37] hover:text-[#e0bb4d]'
      },
      variables: {
        colorPrimary: '#D4AF37'
      }
    }),
    []
  )

  if (!open) return null

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true">
      <div className="auth-modal">
        <button
          aria-label="Close"
          className="auth-close"
          type="button"
          onClick={onClose}
        >
          ×
        </button>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-in'}
            className={mode === 'sign-in' ? 'is-active' : ''}
            onClick={() => setMode('sign-in')}
          >
            התחברות
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-up'}
            className={mode === 'sign-up' ? 'is-active' : ''}
            onClick={() => setMode('sign-up')}
          >
            הרשמה
          </button>
        </div>

        <div className="auth-body">
          {mode === 'sign-in' ? (
            <SignIn
              appearance={appearance}
              redirectUrl="/"
            />
          ) : (
            <SignUp
              appearance={appearance}
              redirectUrl="/"
            />
          )}
        </div>
      </div>
    </div>
  )
}


