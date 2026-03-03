#!/bin/bash
# 隐私计算流程编辑器 - Windows 构建脚本

set -e

echo "=========================================="
echo "  隐私计算流程编辑器 - Windows 构建"
echo "=========================================="

# 设置镜像源加速
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# 清理旧的构建产物
echo ""
echo "清理旧的构建产物..."
rm -rf release/
rm -f *.zip

# 构建 Electron 应用
echo ""
echo "正在构建 Electron 应用..."
npm run electron:build 2>&1 | grep -v "wine is required" | grep -v "app-builder process failed" || true

# 检查 exe 是否生成
if [ ! -f "release/win-unpacked/隐私计算流程编辑器.exe" ]; then
    echo "错误：exe 文件未生成"
    exit 1
fi

echo ""
echo "正在打包 zip..."
powershell.exe -Command "Compress-Archive -Path 'C:\dev\vue2\release\win-unpacked\*' -DestinationPath 'C:\dev\vue2\隐私计算流程编辑器-win-x64.zip' -Force"

# 检查 zip 是否生成
if [ -f "隐私计算流程编辑器-win-x64.zip" ]; then
    echo ""
    echo "=========================================="
    echo "  构建完成！"
    echo "=========================================="
    ls -lh 隐私计算流程编辑器-win-x64.zip
else
    echo "错误：zip 文件未生成"
    exit 1
fi
