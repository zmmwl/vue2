#!/usr/bin/env node

/**
 * 独立静态文件服务器
 * 用于部署打包后的前端应用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const PORT = process.env.PORT || 5172;
const HOST = process.env.HOST || '0.0.0.0';

// 获取静态文件目录
// pkg 打包后，__dirname 指向可执行文件所在目录
// 开发模式下，__dirname 指向当前脚本所在目录
const STATIC_DIR = path.join(__dirname, 'dist');

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.map': 'application/json'
};

// 获取 MIME 类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 解码 URL
  let filePath = decodeURIComponent(req.url.split('?')[0]);

  // 移除开头的斜杠
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }

  // 默认文件
  if (filePath === '' || filePath === '/') {
    filePath = 'index.html';
  }

  // 构建完整路径
  const fullPath = path.join(STATIC_DIR, filePath);

  // 安全检查：防止目录遍历攻击
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 检查文件是否存在
  fs.stat(normalizedPath, (err, stats) => {
    if (err) {
      // 文件不存在，返回 index.html (支持 SPA 路由)
      const indexPath = path.join(STATIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, data) => {
        if (indexErr) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    // 如果是目录，尝试读取 index.html
    if (stats.isDirectory()) {
      const indexPath = path.join(normalizedPath, 'index.html');
      fs.readFile(indexPath, (indexErr, data) => {
        if (indexErr) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    // 读取并返回文件
    fs.readFile(normalizedPath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }

      const mimeType = getMimeType(normalizedPath);
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'max-age=31536000' // 静态资源缓存 1 年
      });
      res.end(data);
    });
  });
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('===========================================');
  console.log('  隐私计算流程编辑器 - 独立部署版');
  console.log('===========================================');
  console.log('');
  console.log(`  服务已启动:`);
  console.log(`  - 本地访问: http://localhost:${PORT}`);
  console.log(`  - 网络访问: http://${getLocalIP()}:${PORT}`);
  console.log('');
  console.log(`  静态文件目录: ${STATIC_DIR}`);
  console.log('');
  console.log('  按 Ctrl+C 停止服务');
  console.log('===========================================');
  console.log('');
});

// 获取本机 IP 地址
function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return HOST;
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n正在关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务...');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});
