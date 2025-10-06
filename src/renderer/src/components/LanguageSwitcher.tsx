import { useTranslation } from 'react-i18next'
import { useState } from 'react'

interface LanguageSwitcherProps {
  theme?: {
    primary: string
    primaryLight: string
    primaryDark: string
  } | null
}

function LanguageSwitcher({ theme }: LanguageSwitcherProps): React.JSX.Element {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string): void => {
    // Notify main process to change language
    // This will update tray menu and notify all windows
    if (window.api && window.api.setLanguage) {
      window.api.setLanguage(langCode)
    } else {
      // Fallback to direct change if API is not available
      i18n.changeLanguage(langCode)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{currentLanguage.name}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          />
          
          {/* Dropdown */}
          <div
            className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  i18n.language === lang.code ? 'font-semibold' : ''
                }`}
                style={{
                  color: i18n.language === lang.code ? theme?.primary || '#6366F1' : undefined
                }}
              >
                {lang.name}
                {i18n.language === lang.code && (
                  <svg
                    className="inline-block w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher

