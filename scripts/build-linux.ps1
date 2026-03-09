# Windows 下使用 WSL 构建 Linux 部署包的脚本
# 需要先安装 WSL

param(
    [switch]$UseWSL = $true
)

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  构建 Linux x86 独立部署包" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

if ($UseWSL) {
    Write-Host ""
    Write-Host "[信息] 使用 WSL 进行构建..." -ForegroundColor Yellow

    # 获取当前脚本所在目录
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectRoot = Split-Path -Parent $ScriptDir

    # 转换为 WSL 路径
    $WslPath = wsl wslpath -u "$ProjectRoot"

    Write-Host "[信息] 项目路径: $WslPath" -ForegroundColor Gray

    # 在 WSL 中执行构建脚本
    wsl -e bash -c "cd '$WslPath' && chmod +x scripts/build-linux.sh && ./scripts/build-linux.sh"

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host "  构建成功!" -ForegroundColor Green
        Write-Host "===========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  部署包位置: $ProjectRoot\release\" -ForegroundColor Yellow
    } else {
        Write-Host "构建失败!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[错误] 非 WSL 模式暂不支持，请使用 WSL" -ForegroundColor Red
    Write-Host "       或直接在 Linux 环境中运行 scripts/build-linux.sh" -ForegroundColor Yellow
    exit 1
}
