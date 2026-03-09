#!/bin/bash

# Linux x86 独立部署包构建脚本
# 此脚本在 Linux 环境下运行，生成完全独立的部署包

set -e

echo "==========================================="
echo "  开始构建 Linux x86 独立部署包"
echo "==========================================="

# 配置
PACKAGE_NAME="privacy-flow-editor"
VERSION="1.0.0"
OUTPUT_DIR="release"
TEMP_DIR="release_temp"

# 清理旧的构建文件
echo ""
echo "[1/5] 清理旧的构建文件..."
rm -rf "$OUTPUT_DIR"
rm -rf "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

# 构建前端
echo ""
echo "[2/5] 构建前端应用..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "错误: 前端构建失败，dist 目录不存在"
    exit 1
fi

# 复制 dist 到临时目录
echo ""
echo "[3/5] 复制构建产物..."
cp -r dist "$TEMP_DIR/"

# 使用 pkg 打包 Node.js 服务器
echo ""
echo "[4/5] 打包 Node.js 服务器为独立可执行文件..."

# 临时 package.json 用于 pkg
cat > "$TEMP_DIR/package.json" << 'PKGJSON'
{
  "name": "privacy-flow-editor-server",
  "version": "1.0.0",
  "main": "server.cjs",
  "bin": "server.cjs",
  "pkg": {
    "assets": ["dist/**/*"],
    "outputPath": "../release",
    "targets": ["node18-linux-x64"]
  }
}
PKGJSON

# 复制服务器文件
cp server.cjs "$TEMP_DIR/"

# 进入临时目录打包
cd "$TEMP_DIR"

# 安装 pkg（如果未安装）
if ! command -v pkg &> /dev/null; then
    echo "安装 pkg 工具..."
    npm install -g pkg
fi

# 使用 pkg 打包
echo "正在打包可执行文件..."
pkg . --targets node18-linux-x64 --output "../release/privacy-flow-editor"

cd ..

# 创建最终部署包目录结构
echo ""
echo "[5/5] 创建部署包结构..."

FINAL_DIR="$OUTPUT_DIR/$PACKAGE_NAME-linux-x64"
mkdir -p "$FINAL_DIR"

# 复制可执行文件
mv "$OUTPUT_DIR/privacy-flow-editor" "$FINAL_DIR/"
chmod +x "$FINAL_DIR/privacy-flow-editor"

# 复制静态文件（pkg 打包的资源文件访问有问题，这里单独放置）
cp -r dist "$FINAL_DIR/"

# 创建启动脚本
cat > "$FINAL_DIR/start.sh" << 'STARTSH'
#!/bin/bash

# 隐私计算流程编辑器启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 切换到应用目录
cd "$SCRIPT_DIR"

# 启动服务
./privacy-flow-editor

STARTSH
chmod +x "$FINAL_DIR/start.sh"

# 创建停止脚本
cat > "$FINAL_DIR/stop.sh" << 'STOPSH'
#!/bin/bash

# 停止服务
pkill -f "privacy-flow-editor" 2>/dev/null
echo "服务已停止"

STOPSH
chmod +x "$FINAL_DIR/stop.sh"

# 创建 README
cat > "$FINAL_DIR/README.txt" << 'README'
===========================================
  隐私计算流程编辑器 - Linux x64 独立部署版
  版本: 1.0.0
===========================================

【系统要求】
- Linux x86_64 (amd64) 系统
- 无需安装 Node.js 或其他依赖

【安装说明】
1. 解压部署包到任意目录
   tar -xzf privacy-flow-editor-linux-x64.tar.gz

2. 进入解压目录
   cd privacy-flow-editor-linux-x64

3. 启动服务
   ./start.sh
   或直接运行:
   ./privacy-flow-editor

【访问应用】
- 本地访问: http://localhost:5172
- 网络访问: http://<服务器IP>:5172

【停止服务】
- 按 Ctrl+C 停止前台运行的服务
- 或运行: ./stop.sh

【修改端口】
默认端口为 5172，可通过环境变量修改:
  PORT=8080 ./privacy-flow-editor

【目录结构】
.
├── privacy-flow-editor  # 主程序（独立可执行文件）
├── start.sh            # 启动脚本
├── stop.sh             # 停止脚本
├── dist/               # 前端静态文件
└── README.txt          # 本说明文件

【技术支持】
如有问题，请联系开发团队。

===========================================
README

# 创建 tar.gz 压缩包
echo ""
echo "创建压缩包..."
cd "$OUTPUT_DIR"
tar -czf "$PACKAGE_NAME-linux-x64.tar.gz" "$PACKAGE_NAME-linux-x64"

# 计算文件大小
SIZE=$(du -h "$PACKAGE_NAME-linux-x64.tar.gz" | cut -f1)

# 清理临时文件
rm -rf "../$TEMP_DIR"

echo ""
echo "==========================================="
echo "  构建完成!"
echo "==========================================="
echo ""
echo "  输出目录: $OUTPUT_DIR/"
echo "  部署包: $PACKAGE_NAME-linux-x64.tar.gz"
echo "  文件大小: $SIZE"
echo ""
echo "  使用方法:"
echo "  1. 复制 $OUTPUT_DIR/$PACKAGE_NAME-linux-x64.tar.gz 到目标服务器"
echo "  2. 解压: tar -xzf $PACKAGE_NAME-linux-x64.tar.gz"
echo "  3. 启动: cd $PACKAGE_NAME-linux-x64 && ./start.sh"
echo ""
echo "==========================================="
