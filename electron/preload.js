import { contextBridge } from "electron"
import { ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("desktopPlanner", {
  mode: "wallpaper",
  closeWidget: () => ipcRenderer.invoke("widget:close"),
  resetWidgetPosition: () => ipcRenderer.invoke("widget:reset-position"),
  getWidgetBounds: () => ipcRenderer.invoke("widget:get-bounds"),
  setWidgetBounds: (bounds) => ipcRenderer.invoke("widget:set-bounds", bounds),
})
