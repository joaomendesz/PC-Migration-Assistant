import type { BrowserWindow, Session, WebContents } from 'electron'

export function hardenWebContents(contents: WebContents): void {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))

  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })
}

export function applyProductionCsp(session: Session): void {
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: file:",
            "font-src 'self' data:",
            "connect-src 'self'",
          ].join('; '),
        ],
      },
    })
  })
}

export function preventExternalNavigation(window: BrowserWindow, allowedOrigin?: string): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (allowedOrigin && url.startsWith(allowedOrigin)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
  })
}
