import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createCanvas } from 'canvas'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'

// Define theme interface
interface Theme {
  name: string
  primary: string
  primaryLight: string
  primaryDark: string
  displayName: string
}

// Define available themes
const THEMES: Record<string, Theme> = {
  indigo: {
    name: 'indigo',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    displayName: '靛蓝 (Indigo)'
  },
  blue: {
    name: 'blue',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    displayName: '蓝色 (Blue)'
  },
  emerald: {
    name: 'emerald',
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    displayName: '翡翠绿 (Emerald)'
  },
  rose: {
    name: 'rose',
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    primaryDark: '#E11D48',
    displayName: '玫瑰红 (Rose)'
  },
  violet: {
    name: 'violet',
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    displayName: '紫罗兰 (Violet)'
  },
  amber: {
    name: 'amber',
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    primaryDark: '#D97706',
    displayName: '琥珀色 (Amber)'
  }
}

// Initialize store for theme and language configuration
const store = new Store({
  defaults: {
    theme: 'indigo',
    language: 'auto' // 'auto', 'zh', or 'en'
  }
})

// Language translations for tray menu
const TRANSLATIONS = {
  en: {
    pauseTimer: 'Pause Timer',
    resumeTimer: 'Resume Timer',
    logNow: 'Log Now',
    viewLogs: 'View Logs',
    openFile: 'Open Log File',
    theme: 'Theme',
    language: 'Language',
    devMode: 'Dev Mode: 3s',
    quit: 'Quit',
    languageAuto: 'Auto (System)',
    languageChinese: '中文',
    languageEnglish: 'English'
  },
  zh: {
    pauseTimer: '暂停计时',
    resumeTimer: '继续计时',
    logNow: '立即记录',
    viewLogs: '查看日志',
    openFile: '打开日志文件',
    theme: '主题',
    language: '语言',
    devMode: '开发模式: 3秒',
    quit: '退出',
    languageAuto: '自动（跟随系统）',
    languageChinese: '中文',
    languageEnglish: 'English'
  }
}

// Get system language
function getSystemLanguage(): string {
  const locale = app.getLocale().toLowerCase()
  if (locale.startsWith('zh')) {
    return 'zh'
  }
  return 'en'
}

// Get current language
function getCurrentLanguage(): string {
  const langSetting = store.get('language', 'auto') as string
  if (langSetting === 'auto') {
    return getSystemLanguage()
  }
  return langSetting
}

// Get translations for current language
function t(key: string): string {
  const lang = getCurrentLanguage()
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key
}

// Get current theme
function getCurrentTheme(): Theme {
  const themeName = store.get('theme', 'indigo') as string
  return THEMES[themeName] || THEMES.indigo
}

let tray: Tray | null = null
let popupWindow: BrowserWindow | null = null
let viewerWindow: BrowserWindow | null = null
let timer: NodeJS.Timeout | null = null
let isPaused = false
const TIMER_INTERVAL = 25 * 60 * 1000 // 25 minutes in milliseconds
const DEV_TIMER_INTERVAL = 3 * 1000 // 3 seconds for development testing
let isDevMode = false
let iconUpdateInterval: NodeJS.Timeout | null = null
let timerStartTime: number = Date.now()

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

// Create dynamic progress icon for tray
function createProgressIcon(progress: number, remainingMinutes: number): Electron.NativeImage {
  // Use 44x44 for Retina display (@2x of 22x22 standard macOS tray icon)
  const size = 44
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  
  // Enable anti-aliasing for smoother rendering
  ctx.antialias = 'default'
  ctx.patternQuality = 'best'
  
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = 21 // Outer circle radius
  const ringWidth = 6   // Progress ring thickness
  
  // Get current theme color
  const theme = getCurrentTheme()
  
  // Step 1: Draw outer background circle (light gray)
  ctx.beginPath()
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI)
  ctx.fillStyle = '#D1D5DB'
  ctx.fill()
  
  // Step 2: Draw progress arc (themed color, clockwise from top)
  if (progress > 0) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress))
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = theme.primary
    ctx.fill()
  }
  
  // Step 3: Draw inner white circle (creates the ring effect)
  const innerRadius = outerRadius - ringWidth
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  
  // Step 4: Draw remaining minutes text in center
  ctx.fillStyle = '#1F2937' // Darker gray for better contrast
  
  // Use system font based on platform (node-canvas requires specific font names)
  const systemFont = process.platform === 'darwin' 
    ? 'SF Pro Text'     // macOS San Francisco font (fallback to Helvetica Neue if not available)
    : process.platform === 'win32'
    ? 'Segoe UI'        // Windows system font
    : 'Ubuntu'          // Linux fallback
  
  ctx.font = `bold 18px ${systemFont}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  
  const text = remainingMinutes.toString()
  const metrics = ctx.measureText(text)
  
  // Calculate vertical center more precisely
  // Use actualBoundingBox for accurate vertical centering
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
  const textY = centerY + (textHeight / 2) - metrics.actualBoundingBoxDescent
  
  ctx.fillText(text, centerX, textY)
  
  // Convert canvas to PNG buffer and create nativeImage with proper scaling
  const buffer = canvas.toBuffer('image/png')
  const image = nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size,
    scaleFactor: 2.0 // Mark as @2x for Retina
  })
  
  return image
}

// Update tray icon with current progress
function updateTrayIcon(): void {
  if (!tray) return
  
  if (isPaused) {
    // Show a static gray circle when paused
    const pausedIcon = createProgressIcon(0, 0)
    tray.setImage(pausedIcon)
    return
  }
  
  const interval = isDevMode ? DEV_TIMER_INTERVAL : TIMER_INTERVAL
  const elapsed = Date.now() - timerStartTime
  const progress = Math.min(elapsed / interval, 1)
  const totalMinutes = interval / (60 * 1000)
  const remainingMinutes = Math.max(0, Math.ceil(totalMinutes - (elapsed / (60 * 1000))))
  
  const icon = createProgressIcon(progress, remainingMinutes)
  tray.setImage(icon)
}

// Start updating the icon every second
function startIconUpdates(): void {
  if (iconUpdateInterval) {
    clearInterval(iconUpdateInterval)
  }
  
  updateTrayIcon()
  iconUpdateInterval = setInterval(updateTrayIcon, 1000)
}

// Stop icon updates
function stopIconUpdates(): void {
  if (iconUpdateInterval) {
    clearInterval(iconUpdateInterval)
    iconUpdateInterval = null
  }
}

// Start the timer
function startTimer(): void {
  if (timer) {
    clearInterval(timer)
  }
  
  // Reset timer start time
  timerStartTime = Date.now()
  
  // Start icon updates
  startIconUpdates()
  
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
  stopIconUpdates()
  updateTrayIcon() // Update to show paused state
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

// Change language
function changeLanguage(lang: string): void {
  store.set('language', lang)
  updateTrayMenu()
  
  // Notify all windows about language change
  const actualLang = getCurrentLanguage()
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.webContents.send('language-changed', actualLang)
  }
  if (viewerWindow && !viewerWindow.isDestroyed()) {
    viewerWindow.webContents.send('language-changed', actualLang)
  }
}

// Get theme display name for current language
function getThemeDisplayName(themeName: string): string {
  const lang = getCurrentLanguage()
  const themeNames = {
    indigo: { zh: '靛蓝', en: 'Indigo' },
    blue: { zh: '蓝色', en: 'Blue' },
    emerald: { zh: '翡翠绿', en: 'Emerald' },
    rose: { zh: '玫瑰红', en: 'Rose' },
    violet: { zh: '紫罗兰', en: 'Violet' },
    amber: { zh: '琥珀色', en: 'Amber' }
  }
  return themeNames[themeName]?.[lang] || themeName
}

// Update tray menu
function updateTrayMenu(): void {
  if (!tray) return

  const currentTheme = getCurrentTheme()
  const currentLangSetting = store.get('language', 'auto') as string

  const menuTemplate: any[] = [
    {
      label: isPaused ? t('resumeTimer') : t('pauseTimer'),
      click: () => {
        if (isPaused) {
          resumeTimer()
        } else {
          pauseTimer()
        }
      }
    },
    {
      label: t('logNow'),
      click: () => {
        createPopupWindow()
      }
    },
    { type: 'separator' },
    {
      label: t('viewLogs'),
      click: () => {
        createViewerWindow()
      }
    },
    {
      label: t('openFile'),
      click: openLogFile
    },
    { type: 'separator' },
    {
      label: t('language'),
      submenu: [
        {
          label: t('languageAuto'),
          type: 'checkbox',
          checked: currentLangSetting === 'auto',
          click: () => changeLanguage('auto')
        },
        { type: 'separator' },
        {
          label: t('languageChinese'),
          type: 'checkbox',
          checked: currentLangSetting === 'zh',
          click: () => changeLanguage('zh')
        },
        {
          label: t('languageEnglish'),
          type: 'checkbox',
          checked: currentLangSetting === 'en',
          click: () => changeLanguage('en')
        }
      ]
    },
    {
      label: t('theme'),
      submenu: Object.values(THEMES).map(theme => ({
        label: getThemeDisplayName(theme.name),
        type: 'checkbox',
        checked: currentTheme.name === theme.name,
        click: () => {
          store.set('theme', theme.name)
          updateTrayIcon()
          // Notify all windows about theme change
          if (popupWindow && !popupWindow.isDestroyed()) {
            popupWindow.webContents.send('theme-changed', theme)
          }
          if (viewerWindow && !viewerWindow.isDestroyed()) {
            viewerWindow.webContents.send('theme-changed', theme)
          }
          updateTrayMenu()
        }
      }))
    }
  ]

  // Add developer option only in development mode
  if (is.dev) {
    menuTemplate.push({ type: 'separator' })
    menuTemplate.push({
      label: t('devMode'),
      type: 'checkbox',
      checked: isDevMode,
      click: toggleDevMode
    })
  }

  menuTemplate.push({ type: 'separator' })
  menuTemplate.push({
    label: t('quit'),
    click: () => {
      app.quit()
    }
  })

  const contextMenu = Menu.buildFromTemplate(menuTemplate)
  tray.setContextMenu(contextMenu)
}

// Create system tray
function createTray(): void {
  const initialMinutes = isDevMode ? Math.ceil(DEV_TIMER_INTERVAL / (60 * 1000)) : Math.ceil(TIMER_INTERVAL / (60 * 1000))
  const initialIcon = createProgressIcon(0, initialMinutes)
  tray = new Tray(initialIcon)
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

  ipcMain.handle('get-theme', () => {
    return getCurrentTheme()
  })

  ipcMain.handle('get-available-themes', () => {
    return Object.values(THEMES)
  })

  ipcMain.handle('get-language', () => {
    return getCurrentLanguage()
  })

  ipcMain.on('set-language', (_event, lang: string) => {
    changeLanguage(lang)
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
  stopIconUpdates()
})
