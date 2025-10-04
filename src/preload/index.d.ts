import { ElectronAPI } from '@electron-toolkit/preload'

interface LogEntry {
  timestamp: string
  action: string
}

interface API {
  submitLog: (action: string) => void
  closePopup: () => void
  getLogs: () => Promise<LogEntry[]>
  onLogsUpdated: (callback: () => void) => (() => void) | undefined
  closeViewer: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
