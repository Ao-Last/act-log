import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let tray: Tray | null = null
let popupWindow: BrowserWindow | null = null
let viewerWindow: BrowserWindow | null = null
let timer: NodeJS.Timeout | null = null
let isPaused = false
const TIMER_INTERVAL = 25 * 60 * 1000 // 25 minutes in milliseconds
const DEV_TIMER_INTERVAL = 3 * 1000 // 3 seconds for development testing
let isDevMode = false

// Get the log file path
function getLogFilePath(): string {
  return join(app.getPath('userData'), 'action_log.jsonl')
}

// Append log entry to JSON Lines file
async function appendLogEntry(action: string): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action
  }
  const logLine = JSON.stringify(logEntry) + '\n'
  const logFilePath = getLogFilePath()
  
  try {
    await fs.appendFile(logFilePath, logLine, 'utf-8')
    // Notify viewer window if it's open
    if (viewerWindow && !viewerWindow.isDestroyed()) {
      viewerWindow.webContents.send('logs-updated')
    }
  } catch (error) {
    console.error('Failed to write log entry:', error)
  }
}

// Read all log entries
async function readLogEntries(): Promise<Array<{ timestamp: string; action: string }>> {
  const logFilePath = getLogFilePath()
  
  try {
    await fs.access(logFilePath)
    const content = await fs.readFile(logFilePath, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.length > 0)
    const logs = lines.map(line => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    }).filter(log => log !== null)
    
    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  } catch (error) {
    // File doesn't exist yet
    return []
  }
}

// Create popup window
function createPopupWindow(): void {
  // If window already exists, don't create a new one or steal focus
  if (popupWindow && !popupWindow.isDestroyed()) {
    return
  }

  const preloadPath = join(__dirname, '../preload/index.mjs')
  
  popupWindow = new BrowserWindow({
    width: 520,
    height: 240,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Center the window on screen
  popupWindow.center()

  popupWindow.on('ready-to-show', () => {
    popupWindow?.show()
    popupWindow?.focus()
  })

  popupWindow.on('closed', () => {
    popupWindow = null
  })

  // Load the popup page
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    popupWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/popup.html')
  } else {
    popupWindow.loadFile(join(__dirname, '../renderer/popup.html'))
  }
}

// Create log viewer window
function createViewerWindow(): void {
  // If window already exists, focus it
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    viewerWindow.focus()
    return
  }

  const preloadPath = join(__dirname, '../preload/index.mjs')
  
  viewerWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    show: false,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  viewerWindow.on('ready-to-show', () => {
    viewerWindow?.show()
  })

  viewerWindow.on('closed', () => {
    viewerWindow = null
  })

  // Load the viewer page
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    viewerWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/viewer.html')
  } else {
    viewerWindow.loadFile(join(__dirname, '../renderer/viewer.html'))
  }
}

// Start the timer
function startTimer(): void {
  if (timer) {
    clearInterval(timer)
  }
  
  if (!isPaused) {
    const interval = isDevMode ? DEV_TIMER_INTERVAL : TIMER_INTERVAL
    timer = setInterval(() => {
      if (!isPaused) {
        createPopupWindow()
      }
    }, interval)
  }
}

// Pause the timer
function pauseTimer(): void {
  isPaused = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  updateTrayMenu()
}

// Resume the timer
function resumeTimer(): void {
  isPaused = false
  startTimer()
  updateTrayMenu()
}

// Toggle dev mode (3 second timer)
function toggleDevMode(): void {
  isDevMode = !isDevMode
  
  // Restart timer with new interval
  if (!isPaused) {
    startTimer()
  }
  updateTrayMenu()
}

// Open log file in default application
async function openLogFile(): Promise<void> {
  const logFilePath = getLogFilePath()
  try {
    // Create the file if it doesn't exist
    await fs.access(logFilePath).catch(async () => {
      await fs.writeFile(logFilePath, '', 'utf-8')
    })
    shell.openPath(logFilePath)
  } catch (error) {
    console.error('Failed to open log file:', error)
  }
}

// Update tray menu
function updateTrayMenu(): void {
  if (!tray) return

  const menuTemplate: any[] = [
    {
      label: isPaused ? '继续计时 (Resume)' : '暂停计时 (Pause)',
      click: () => {
        if (isPaused) {
          resumeTimer()
        } else {
          pauseTimer()
        }
      }
    },
    {
      label: '立即记录 (Log Now)',
      click: () => {
        createPopupWindow()
      }
    },
    { type: 'separator' },
    {
      label: '查看日志 (View Logs)',
      click: () => {
        createViewerWindow()
      }
    },
    {
      label: '打开日志文件 (Open File)',
      click: openLogFile
    }
  ]

  // Add developer option only in development mode
  if (is.dev) {
    menuTemplate.push({ type: 'separator' })
    menuTemplate.push({
      label: isDevMode ? '✓ 开发模式: 3秒 (Dev: 3s)' : '开发模式: 3秒 (Dev: 3s)',
      type: 'checkbox',
      checked: isDevMode,
      click: toggleDevMode
    })
  }

  menuTemplate.push({ type: 'separator' })
  menuTemplate.push({
    label: '退出 (Quit)',
    click: () => {
      app.quit()
    }
  })

  const contextMenu = Menu.buildFromTemplate(menuTemplate)
  tray.setContextMenu(contextMenu)
}

// Create system tray
function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Act Log - Activity Logger')
  updateTrayMenu()
  
  // Hide dock icon on macOS since we only use tray
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.actlog')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create system tray
  createTray()

  // Start the timer
  startTimer()

  // IPC handlers
  ipcMain.on('submit-log', async (_event, action: string) => {
    await appendLogEntry(action)
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close()
      popupWindow = null
    }
    // Restart timer after logging
    startTimer()
  })

  ipcMain.on('close-popup', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close()
      popupWindow = null
    }
  })

  ipcMain.handle('get-logs', async () => {
    return await readLogEntries()
  })

  ipcMain.on('close-viewer', () => {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
      viewerWindow.close()
      viewerWindow = null
    }
  })

  // Don't create a main window, this app only shows popups
  // and lives in the system tray
})

// Prevent the app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Keep the app running in the background
})

// Handle app quit
app.on('before-quit', () => {
  if (timer) {
    clearInterval(timer)
  }
})
