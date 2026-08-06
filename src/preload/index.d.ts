import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    api: {
      dbQuery: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
      fetchCoordinates: (comune: string, foglio: string, particella: string) => Promise<{ success: boolean; data?: [number, number]; error?: string }>
      fetchWFS: (url: string) => Promise<{ success: boolean; data?: string; error?: string }>
      getComuni: () => Promise<{ success: boolean; data?: any[]; error?: string }>
      selectPdf: () => Promise<string | null>
      savePdf: (sourcePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
      openPdf: (pdfPath: string) => Promise<{ success: boolean; error?: string }>
      syncSchema: () => Promise<{ success: boolean; error?: string }>
    }
  }
}
