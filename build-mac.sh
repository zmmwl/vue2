#!/bin/bash
# 隐私计算流程编辑器 - macOS 构建脚本
# 在 macOS 上运行此脚本

set -e

echo "=========================================="
echo "  隐私计算流程编辑器 - macOS 构建"
echo "=========================================="

# 检查是否在 macOS 上运行
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "错误：此脚本必须在 macOS 上运行"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误：未安装 Node.js，请先安装 Node.js"
    exit 1
fi

echo "Node 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 设置镜像源加速
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install

# 构建
echo ""
echo "正在构建 macOS 应用..."
npm run electron:build:mac

echo ""
echo "=========================================="
echo "  构建完成！"
echo "=========================================="
echo ""
echo "生成的文件在 release/ 目录下："
ls -la release/*.zip 2>/dev/null || echo "未找到 zip 文件"
ls -la release/*.dmg 2>/dev/null || echo "未找到 dmg 文件"
