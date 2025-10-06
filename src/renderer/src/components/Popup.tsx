import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface Theme {
  name: string
  primary: string
  primaryLight: string
  primaryDark: string
  displayName: string
}

function Popup(): React.JSX.Element {
  const { t } = useTranslation()
  const [action, setAction] = useState('')
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    // Auto-focus the input when the window opens
    const input = document.getElementById('action-input') as HTMLInputElement
    if (input) {
      input.focus()
    }

    // Load current theme
    window.api.getTheme().then(setTheme)

    // Listen for theme changes
    const unsubscribe = window.api.onThemeChanged((newTheme) => {
      setTheme(newTheme)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Apply theme CSS variables when theme changes
  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.primary)
      document.documentElement.style.setProperty('--theme-primary-light', theme.primaryLight)
      document.documentElement.style.setProperty('--theme-primary-dark', theme.primaryDark)
    }
  }, [theme])

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (action.trim()) {
      if (window.api && window.api.submitLog) {
        window.api.submitLog(action.trim())
      }
      setAction('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      if (window.api && window.api.closePopup) {
        window.api.closePopup()
      }
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'transparent' }}>
      <div className="w-full h-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col justify-center">
        {/* Prompt */}
        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          {t('popup.title')}
        </h1>
        <p className="text-xs text-gray-500 mb-4 text-center">
          {t('popup.subtitle')}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="action-input"
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('popup.inputPlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400 text-sm"
            style={{ 
              '--tw-ring-color': 'var(--theme-primary)' 
            } as React.CSSProperties}
            autoComplete="off"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!action.trim()}
              className="flex-1 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
              style={{
                backgroundColor: action.trim() ? 'var(--theme-primary)' : undefined,
                '&:hover': {
                  backgroundColor: action.trim() ? 'var(--theme-primary-dark)' : undefined
                }
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (action.trim() && theme) {
                  e.currentTarget.style.backgroundColor = theme.primaryDark
                }
              }}
              onMouseLeave={(e) => {
                if (action.trim() && theme) {
                  e.currentTarget.style.backgroundColor = theme.primary
                }
              }}
            >
              {t('popup.submitButton')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.api && window.api.closePopup) {
                  window.api.closePopup()
                }
              }}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors duration-200 text-sm"
            >
              {t('popup.cancelButton')}
            </button>
          </div>
        </form>

        {/* Hint */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          {t('popup.hint')}
        </p>
      </div>
    </div>
  )
}

export default Popup

