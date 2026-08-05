import { app, shell, BrowserWindow, ipcMain, session, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB, runQuery } from './db'
import { initDuckDB, getCoordinateCatastali } from './duckdbService'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import comuniJsonPath from '../../resources/comuni.data?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Initialize SQLite database
  initDB();
  initDuckDB();

  // IPC handlers for database queries
  ipcMain.handle('db-query', async (_event, query: string, params: any[]) => {
    try {
      return { success: true, data: runQuery(query, params) };
    } catch (error: any) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fetch-coordinates', async (_event, comune: string, foglio: string, particella: string) => {
    try {
      const coords = await getCoordinateCatastali(comune, foglio, particella);
      return { success: true, data: coords };
    } catch (error: any) {
      console.error("Fetch coordinates error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fetch-wfs', async (_event, url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      return { success: true, data: text };
    } catch (error: any) {
      console.error("Fetch WFS error:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-comuni', async () => {
    try {
      const data = await fs.readFile(comuniJsonPath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    } catch (error: any) {
      console.error('Error reading comuni.json:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:openPdf', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle('save-pdf', async (_event, sourcePath: string) => {
    try {
      const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
      const baseDir = isDev 
        ? join(__dirname, '../../pdfs')
        : join(require('path').dirname(app.getPath('exe')), 'pdfs');
      
      if (!fsSync.existsSync(baseDir)) {
        await fs.mkdir(baseDir, { recursive: true });
      }

      const filename = `${Date.now()}_${require('path').basename(sourcePath)}`;
      const destPath = join(baseDir, filename);
      
      await fs.copyFile(sourcePath, destPath);
      return { success: true, data: destPath };
    } catch (error: any) {
      console.error('Error saving PDF:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-pdf', async (_event, pdfPath: string) => {
    try {
      if (fsSync.existsSync(pdfPath)) {
        await shell.openPath(pdfPath);
        return { success: true };
      }
      return { success: false, error: 'File non trovato' };
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // CSP: two separate policies for dev and prod.
  // Dev needs 'unsafe-inline' for @vitejs/plugin-react HMR preamble, plus OSM tile domains.
  // Prod uses a strict script-src with no unsafe-inline.
  const cspDev =
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "worker-src 'self' blob:; " +
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.arcgisonline.com; " +
    "connect-src 'self' ws://localhost:* http://localhost:* https://*.tile.openstreetmap.org https://*.openstreetmap.org https://wfs.cartografia.agenziaentrate.gov.it https://*.arcgisonline.com https://demotiles.maplibre.org"

  const cspProd =
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "worker-src 'self' blob:; " +
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.arcgisonline.com; " +
    "connect-src 'self' https://*.tile.openstreetmap.org https://*.openstreetmap.org https://wfs.cartografia.agenziaentrate.gov.it https://*.arcgisonline.com https://demotiles.maplibre.org"

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [is.dev ? cspDev : cspProd]
      }
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
