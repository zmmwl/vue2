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
    // 打开 DevTools
    mainWindow.webContents.openDevTools();
    // 打包后结构: resources/app/electron/main.mjs
    // dist 目录: resources/app/dist/index.html
    const appPath = app.isPackaged ? join(__dirname, '..') : join(__dirname, '..');
    const indexPath = join(appPath, 'dist', 'index.html');
    console.log('=== 调试信息 ===');
    console.log('app.isPackaged:', app.isPackaged);
    console.log('__dirname:', __dirname);
    console.log('appPath:', appPath);
    console.log('indexPath:', indexPath);
    // 使用 loadFile 而不是 loadURL，这样可以正确处理相对路径
    mainWindow.loadFile(indexPath).catch(err => {
        console.error('加载失败:', err);
        const errorHtml = '<html><head><title>加载失败</title></head>' +
            '<body style="background:#333;color:#fff;padding:20px;font-family:sans-serif;">' +
            '<h1 style="color:red">页面加载失败</h1>' +
            '<p><strong>错误:</strong> ' + err.message + '</p>' +
            '<p><strong>路径:</strong> ' + indexPath + '</p>' +
            '</body></html>';
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
    });
    // 监听控制台消息
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log('[Renderer]', message);
    });
    // 监听加载错误
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
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
