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
