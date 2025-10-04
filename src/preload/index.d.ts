import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
  submitLog: (action: string) => void
  closePopup: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
