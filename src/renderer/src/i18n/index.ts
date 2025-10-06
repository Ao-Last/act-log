import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

// Get initial language from main process or fallback to browser language
const getInitialLanguage = async (): Promise<string> => {
  // Try to get language from main process if window.api is available
  if (window.api && window.api.getLanguage) {
    try {
      return await window.api.getLanguage()
    } catch (error) {
      console.error('Failed to get language from main process:', error)
    }
  }

  // Fallback to browser/system language
  const browserLang = navigator.language.toLowerCase()
  
  // Check if browser language starts with 'zh' (Chinese)
  if (browserLang.startsWith('zh')) {
    return 'zh'
  }
  
  // Default to English
  return 'en'
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      zh: {
        translation: zh
      }
    },
    lng: 'en', // Will be updated after initialization
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  })

// Load language from main process after initialization
getInitialLanguage().then((lang) => {
  i18n.changeLanguage(lang)
})

// Listen for language changes from main process
if (window.api && window.api.onLanguageChanged) {
  window.api.onLanguageChanged((lang: string) => {
    i18n.changeLanguage(lang)
  })
}

// Note: Language changes are handled through the setLanguage API
// which updates main process and syncs all windows
// No need to handle languageChanged event here to avoid loops

export default i18n

