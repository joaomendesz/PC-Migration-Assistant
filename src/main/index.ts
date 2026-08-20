import { app, BrowserWindow, Menu, session } from 'electron'
import { join } from 'node:path'
import { registerAppIpc } from './ipc/appIpc'
import {
  applyProductionCsp,
  hardenWebContents,
  preventExternalNavigation,
} from './security/windowSecurity'

const isDevelopment = Boolean(process.env.ELECTRON_RENDERER_URL)
const preloadPath = join(__dirname, '../preload/index.cjs')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    title: 'PC Migration Assistant',
    backgroundColor: '#101214',
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  Menu.setApplicationMenu(null)
  hardenWebContents(mainWindow.webContents)
  preventExternalNavigation(mainWindow, process.env.ELECTRON_RENDERER_URL)

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.warn(`[renderer] ${message} (${sourceId}:${line})`)
    }
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(`[renderer] failed to load ${validatedURL}: ${errorCode} ${errorDescription}`)
    },
  )

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[renderer] process gone: ${details.reason}`)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDevelopment && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('dev.joao.pc-migration-assistant')

  if (!isDevelopment) {
    applyProductionCsp(session.defaultSession)
  }

  registerAppIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
