import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  dbQuery: (query: string, params: any[] = []) => ipcRenderer.invoke('db-query', query, params),
  fetchCoordinates: (comune: string, foglio: string, particella: string) => ipcRenderer.invoke('fetch-coordinates', comune, foglio, particella),
  fetchWFS: (url: string) => ipcRenderer.invoke('fetch-wfs', url),
  getComuni: () => ipcRenderer.invoke('get-comuni'),
  selectPdf: () => ipcRenderer.invoke('dialog:openPdf'),
  savePdf: (sourcePath: string) => ipcRenderer.invoke('save-pdf', sourcePath),
  openPdf: (pdfPath: string) => ipcRenderer.invoke('open-pdf', pdfPath),
  syncSchema: () => ipcRenderer.invoke('sync-schema')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
