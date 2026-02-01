#!/bin/bash
# 测试环境设置脚本
# 设置 UTF-8 编码环境

export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
export LC_CTYPE=zh_CN.UTF-8

# 执行传入的命令
exec "$@"
