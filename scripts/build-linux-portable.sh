#!/bin/bash

# Linux x86 独立部署包构建脚本（使用 Portable Node.js）
# 此方案下载独立的 Node.js 运行时，无需目标机器安装任何依赖

set -e

echo "==========================================="
echo "  构建独立部署包 (Portable Node.js)"
echo "==========================================="

# 配置
PACKAGE_NAME="privacy-flow-editor"
VERSION="1.0.0"
OUTPUT_DIR="release"
NODE_VERSION="20.11.0"
NODE_ARCH="x64"

# 清理
echo ""
echo "[1/6] 清理旧的构建文件..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 构建前端
echo ""
echo "[2/6] 构建前端应用..."
npm run build

if [ ! -d "dist" ]; then
    echo "错误: 前端构建失败"
    exit 1
fi

# 下载 Portable Node.js
echo ""
echo "[3/6] 下载 Node.js $NODE_VERSION (Linux $NODE_ARCH)..."
NODE_TAR="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TAR}"

if [ ! -f "/tmp/$NODE_TAR" ]; then
    echo "下载中..."
    curl -L -o "/tmp/$NODE_TAR" "$NODE_URL" || {
        echo "下载失败，尝试使用镜像..."
        NODE_URL="https://npmmirror.com/mirrors/node/v${NODE_VERSION}/${NODE_TAR}"
        curl -L -o "/tmp/$NODE_TAR" "$NODE_URL"
    }
else
    echo "使用缓存的 Node.js"
fi

# 创建部署目录
echo ""
echo "[4/6] 创建部署包结构..."
DEPLOY_DIR="$OUTPUT_DIR/$PACKAGE_NAME"
mkdir -p "$DEPLOY_DIR/bin"
mkdir -p "$DEPLOY_DIR/app"

# 解压 Node.js
echo "解压 Node.js..."
tar -xf "/tmp/$NODE_TAR" -C "$OUTPUT_DIR"
mv "$OUTPUT_DIR/node-v${NODE_VERSION}-linux-${NODE_ARCH}"/* "$DEPLOY_DIR/bin/"
rm -rf "$OUTPUT_DIR/node-v${NODE_VERSION}-linux-${NODE_ARCH}"

# 复制应用文件
cp -r dist "$DEPLOY_DIR/app/"
cp server.cjs "$DEPLOY_DIR/app/"

# 创建启动脚本
cat > "$DEPLOY_DIR/start.sh" << 'STARTSH'
#!/bin/bash

# 隐私计算流程编辑器启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 设置 PATH 包含内置的 Node.js
export PATH="$SCRIPT_DIR/bin:$PATH"

# 切换到应用目录
cd "$SCRIPT_DIR/app"

# 显示启动信息
clear
echo ""
echo "==========================================="
echo "  隐私计算流程编辑器"
echo "==========================================="
echo ""
echo "  正在启动服务..."
echo ""

# 启动服务
exec "$SCRIPT_DIR/bin/bin/node" server.cjs

STARTSH
chmod +x "$DEPLOY_DIR/start.sh"

# 创建后台启动脚本
cat > "$DEPLOY_DIR/start-daemon.sh" << 'DAEMONSH'
#!/bin/bash

# 后台启动服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/app/server.log"
PID_FILE="$SCRIPT_DIR/app/server.pid"

# 检查是否已运行
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "服务已在运行 (PID: $PID)"
        exit 0
    fi
fi

cd "$SCRIPT_DIR/app"
export PATH="$SCRIPT_DIR/bin:$PATH"

# 后台启动
nohup "$SCRIPT_DIR/bin/bin/node" server.cjs > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

echo "服务已启动 (PID: $(cat $PID_FILE))"
echo "日志文件: $LOG_FILE"

DAEMONSH
chmod +x "$DEPLOY_DIR/start-daemon.sh"

# 创建停止脚本
cat > "$DEPLOY_DIR/stop.sh" << 'STOPSH'
#!/bin/bash

# 停止服务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/app/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        rm -f "$PID_FILE"
        echo "服务已停止 (PID: $PID)"
    else
        echo "服务未运行"
        rm -f "$PID_FILE"
    fi
else
    echo "PID 文件不存在，尝试通过进程名停止..."
    pkill -f "node.*server.cjs" 2>/dev/null && echo "服务已停止" || echo "未找到运行的服务"
fi

STOPSH
chmod +x "$DEPLOY_DIR/stop.sh"

# 创建状态检查脚本
cat > "$DEPLOY_DIR/status.sh" << 'STATUSSH'
#!/bin/bash

# 检查服务状态

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/app/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "服务运行中 (PID: $PID)"
        echo ""
        echo "监听端口:"
        ss -tlnp 2>/dev/null | grep $PID || netstat -tlnp 2>/dev/null | grep $PID || true
        exit 0
    fi
fi

echo "服务未运行"
exit 1

STATUSSH
chmod +x "$DEPLOY_DIR/status.sh"

# 创建 README
cat > "$DEPLOY_DIR/README.txt" << 'README'
===========================================
  隐私计算流程编辑器 - Linux x64 独立部署版
  版本: 1.0.0
===========================================

【系统要求】
- Linux x86_64 (amd64) 系统
- 无需安装 Node.js 或任何其他依赖

【快速开始】
1. 解压部署包
   tar -xzf privacy-flow-editor-linux-x64.tar.gz

2. 进入目录
   cd privacy-flow-editor

3. 启动服务
   ./start.sh

【访问应用】
- 本地访问: http://localhost:5172
- 网络访问: http://<服务器IP>:5172

【命令说明】
./start.sh        - 前台启动服务（推荐，可看到日志输出）
./start-daemon.sh - 后台启动服务（守护进程模式）
./stop.sh         - 停止后台运行的服务
./status.sh       - 查看服务运行状态

【修改端口】
方法1: 修改启动命令
  PORT=8080 ./start.sh

方法2: 编辑 start.sh，在最后一行前添加:
  export PORT=8080

【目录结构】
.
├── start.sh          # 前台启动脚本
├── start-daemon.sh   # 后台启动脚本
├── stop.sh           # 停止脚本
├── status.sh         # 状态检查脚本
├── bin/              # Node.js 运行时（独立）
│   ├── bin/node      # Node.js 可执行文件
│   └── ...
├── app/              # 应用文件
│   ├── server.cjs    # 服务器程序
│   └── dist/         # 前端静态文件
└── README.txt        # 本说明文件

【系统服务（可选）】
如需将应用配置为系统服务，可创建 systemd 服务文件:

sudo tee /etc/systemd/system/privacy-flow-editor.service << EOF
[Unit]
Description=Privacy Flow Editor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/privacy-flow-editor/app
Environment=PATH=/path/to/privacy-flow-editor/bin/bin
ExecStart=/path/to/privacy-flow-editor/bin/bin/node server.cjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable privacy-flow-editor
sudo systemctl start privacy-flow-editor

【常见问题】
Q: 启动时提示权限不足？
A: 运行: chmod +x start.sh

Q: 端口被占用？
A: 修改端口: PORT=8080 ./start.sh

Q: 无法访问？
A: 检查防火墙: sudo firewall-cmd --add-port=5172/tcp

===========================================
README

# 创建压缩包
echo ""
echo "[5/6] 创建压缩包..."
cd "$OUTPUT_DIR"
tar -czf "$PACKAGE_NAME-linux-x64.tar.gz" "$PACKAGE_NAME"

# 计算大小
SIZE=$(du -h "$PACKAGE_NAME-linux-x64.tar.gz" | cut -f1)
TOTAL_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)

# 显示结果
echo ""
echo "[6/6] 构建完成!"
echo ""
echo "==========================================="
echo "  构建成功!"
echo "==========================================="
echo ""
echo "  部署包: $OUTPUT_DIR/$PACKAGE_NAME-linux-x64.tar.gz"
echo "  压缩包大小: $SIZE"
echo "  解压后大小: $TOTAL_SIZE"
echo ""
echo "  部署步骤:"
echo "  1. 复制 $PACKAGE_NAME-linux-x64.tar.gz 到目标服务器"
echo "  2. 解压: tar -xzf $PACKAGE_NAME-linux-x64.tar.gz"
echo "  3. 启动: cd $PACKAGE_NAME && ./start.sh"
echo ""
echo "==========================================="
