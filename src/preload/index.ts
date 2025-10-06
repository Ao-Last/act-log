import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  submitLog: (action: string) => {
    ipcRenderer.send('submit-log', action)
  },
  closePopup: () => {
    ipcRenderer.send('close-popup')
  },
  getLogs: () => {
    return ipcRenderer.invoke('get-logs')
  },
  onLogsUpdated: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('logs-updated', listener)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('logs-updated', listener)
    }
  },
  closeViewer: () => {
    ipcRenderer.send('close-viewer')
  },
  getTheme: () => {
    return ipcRenderer.invoke('get-theme')
  },
  getAvailableThemes: () => {
    return ipcRenderer.invoke('get-available-themes')
  },
  onThemeChanged: (callback: (theme: any) => void) => {
    const listener = (_event: any, theme: any) => callback(theme)
    ipcRenderer.on('theme-changed', listener)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('theme-changed', listener)
    }
  },
  getLanguage: () => {
    return ipcRenderer.invoke('get-language')
  },
  setLanguage: (lang: string) => {
    ipcRenderer.send('set-language', lang)
  },
  onLanguageChanged: (callback: (lang: string) => void) => {
    const listener = (_event: any, lang: string) => callback(lang)
    ipcRenderer.on('language-changed', listener)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('language-changed', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload] contextBridge错误:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
