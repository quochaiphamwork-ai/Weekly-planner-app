import { app, BrowserWindow, ipcMain, screen } from "electron"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { execFile } from "node:child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged
const isWallpaperMode = isDev || process.argv.includes("--wallpaper")
const rendererUrl = process.env.ELECTRON_RENDERER_URL
const wallpaperScriptPath = path.join(__dirname, "wallpaper.ps1")
const appIconPath = path.join(__dirname, "..", "build", "icon.ico")

let mainWindow
const visibleGrip = 72
const defaultWidgetSize = { width: 1100, height: 760 }
const defaultInset = 28

function getWindowHandleBuffer(window) {
  return window.getNativeWindowHandle()
}

function getWindowHandleValue(window) {
  const handleBuffer = getWindowHandleBuffer(window)

  if (process.arch === "x64" || process.arch === "arm64") {
    return handleBuffer.readBigUInt64LE(0).toString()
  }

  return handleBuffer.readUInt32LE(0).toString()
}

function attachWindowToWallpaper(window) {
  if (!isWallpaperMode || process.platform !== "win32" || !existsSync(wallpaperScriptPath)) return

  const hwnd = getWindowHandleValue(window)

  execFile(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      wallpaperScriptPath,
      "-WindowHandle",
      hwnd,
    ],
    (error) => {
      if (error) {
        console.error("Unable to attach window to wallpaper layer:", error)
      }
    }
  )
}

function clampBoundsToDisplay(bounds, minWidth, minHeight) {
  const display = screen.getDisplayMatching({
    x: bounds.x,
    y: bounds.y,
    width: Math.max(bounds.width, minWidth),
    height: Math.max(bounds.height, minHeight),
  })
  const workArea = display.workArea
  const width = Math.max(minWidth, Math.min(Math.round(bounds.width), workArea.width))
  const height = Math.max(minHeight, Math.min(Math.round(bounds.height), workArea.height))
  const minX = workArea.x - width + visibleGrip
  const maxX = workArea.x + workArea.width - visibleGrip
  const minY = workArea.y
  const maxY = workArea.y + workArea.height - visibleGrip

  return {
    x: Math.min(Math.max(Math.round(bounds.x), minX), maxX),
    y: Math.min(Math.max(Math.round(bounds.y), minY), maxY),
    width,
    height,
  }
}

async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize

  mainWindow = new BrowserWindow({
    width: defaultWidgetSize.width,
    height: defaultWidgetSize.height,
    x: Math.max(defaultInset, width - defaultWidgetSize.width - defaultInset),
    y: defaultInset,
    frame: false,
    transparent: true,
    hasShadow: true,
    thickFrame: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: isWallpaperMode,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    minWidth: 440,
    minHeight: 420,
    icon: existsSync(appIconPath) ? appIconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.once("ready-to-show", () => {
    attachWindowToWallpaper(mainWindow)
    mainWindow.setIgnoreMouseEvents(false)
    if (isWallpaperMode) {
      mainWindow.showInactive()
      return
    }

    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on("move", () => {
    if (!mainWindow) return

    const [minWidth, minHeight] = mainWindow.getMinimumSize()
    const clampedBounds = clampBoundsToDisplay(mainWindow.getBounds(), minWidth, minHeight)
    const currentBounds = mainWindow.getBounds()

    if (clampedBounds.x !== currentBounds.x || clampedBounds.y !== currentBounds.y) {
      mainWindow.setPosition(clampedBounds.x, clampedBounds.y)
    }
  })

  if (isDev && rendererUrl) {
    await mainWindow.loadURL(rendererUrl)
    return
  }

  await mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"))
}

ipcMain.handle("widget:close", () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle("widget:reset-position", () => {
  if (!mainWindow) return null

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  const [minWidth, minHeight] = mainWindow.getMinimumSize()
  const resetBounds = clampBoundsToDisplay(
    {
      x: Math.max(defaultInset, width - defaultWidgetSize.width - defaultInset),
      y: defaultInset,
      width: defaultWidgetSize.width,
      height: defaultWidgetSize.height,
    },
    minWidth,
    minHeight
  )

  mainWindow.setBounds(resetBounds)

  return {
    ...resetBounds,
    minWidth,
    minHeight,
  }
})

ipcMain.handle("widget:get-bounds", () => {
  if (!mainWindow) return null

  return {
    ...mainWindow.getBounds(),
    minWidth: mainWindow.getMinimumSize()[0],
    minHeight: mainWindow.getMinimumSize()[1],
  }
})

ipcMain.handle("widget:set-bounds", (_event, bounds) => {
  if (!mainWindow || !bounds) return null

  const [minWidth, minHeight] = mainWindow.getMinimumSize()
  const nextBounds = clampBoundsToDisplay(bounds, minWidth, minHeight)

  mainWindow.setBounds(nextBounds)

  return {
    ...nextBounds,
    minWidth,
    minHeight,
  }
})

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
