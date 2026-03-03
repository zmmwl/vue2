import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: '隐私计算流程编辑器',
        show: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        autoHideMenuBar: true,
    });
    const appPath = app.isPackaged ? join(__dirname, '..') : join(__dirname, '..');
    const indexPath = join(appPath, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
        console.error('加载失败:', err);
    });
    mainWindow.on('closed', () => { });
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
