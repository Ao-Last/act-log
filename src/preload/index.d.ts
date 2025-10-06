import { ElectronAPI } from '@electron-toolkit/preload'

interface LogEntry {
  timestamp: string
  action: string
}

interface Theme {
  name: string
  primary: string
  primaryLight: string
  primaryDark: string
  displayName: string
}

interface API {
  submitLog: (action: string) => void
  closePopup: () => void
  getLogs: () => Promise<LogEntry[]>
  onLogsUpdated: (callback: () => void) => (() => void) | undefined
  closeViewer: () => void
  getTheme: () => Promise<Theme>
  getAvailableThemes: () => Promise<Theme[]>
  onThemeChanged: (callback: (theme: Theme) => void) => (() => void) | undefined
  getLanguage: () => Promise<string>
  setLanguage: (lang: string) => void
  onLanguageChanged: (callback: (lang: string) => void) => (() => void) | undefined
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
