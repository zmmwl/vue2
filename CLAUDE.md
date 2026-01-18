# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + TypeScript + Vite 的隐私计算流程编辑器，使用 @vue-flow/core 库实现可视化流程图编辑功能。

## 开发命令

```bash
# 开发服务器（运行在端口 5172）
npm run dev

# 构建项目（包含类型检查）
npm run build

# 预览构建结果
npm run preview
```

## 代码架构

### 核心组件结构

```
src/
├── App.vue                    # 应用入口，渲染 FlowEditor
├── main.ts                    # Vue 应用初始化
├── views/
│   └── FlowEditor.vue         # 主编辑器视图，包含 Header、Sidebar、Canvas
├── components/
│   ├── Flow/
│   │   ├── FlowHeader.vue     # 顶部工具栏
│   │   ├── FlowSidebar.vue    # 左侧节点面板（拖拽源）
│   │   └── FlowCanvas.vue     # 主画布，管理节点和连接线
│   ├── Nodes/
│   │   ├── DataSourceNode.vue # 数据源节点组件
│   │   └── ComputeTaskNode.vue # 计算任务节点组件
│   └── Edges/
│       └── FlowEdge.vue       # 自定义连接线（带流动光点动画）
├── types/
│   ├── nodes.ts               # 节点相关类型定义
│   ├── edges.ts               # 连接线相关类型定义
│   └── graph.ts               # 图数据相关类型定义
├── utils/
│   ├── node-templates.ts      # 节点模板定义（DATA_SOURCE_TEMPLATES、COMPUTE_TASK_TEMPLATES）
│   └── edge-utils.ts          # 连接线工具函数
└── assets/styles/
    ├── global.scss            # 全局样式
    └── variables.scss         # SCSS 变量
```

### 关键设计模式

#### 1. 固定 Handle 系统
项目使用简化的固定 handle 连接系统：
- **数据源节点**：只有底部的输出 handle (`id="output"`)
- **计算任务节点**：顶部输入 handle (`id="input"`) 和底部输出 handle (`id="output"`)
- Handle 仅在悬停或已连接时显示（输入 handle 为长方形，输出 handle 为圆形）

#### 2. 节点拖放流程
1. `FlowSidebar.vue` 中开始拖拽，使用 `setData('application/vueflow', ...)` 传递节点模板数据
2. `FlowCanvas.vue` 监听 `drop` 事件，使用 `project()` 函数将屏幕坐标转换为画布坐标
3. 创建新节点并推入 `nodes` 数组

#### 3. 连接管理
- 连接时统一使用固定 handle ID：`sourceHandle: 'output'`, `targetHandle: 'input'`
- `onNodesChange` 会自动清理被删除节点的相关连接线
- 每条连接线都有唯一 ID（使用时间戳 + 随机字符串）

#### 4. 节点类型系统
- **数据源节点** (`type: 'data_source'`)：MySQL、PostgreSQL、CSV、Excel、REST API、GraphQL
- **计算任务节点** (`type: 'compute_task'`)：PSI、PIR、MPC、联邦学习、同态加密、差分隐私

## 重要配置

### Vite 配置
- 使用 `@` 别名指向 `src` 目录
- 自动注入 SCSS 变量到所有组件
- 开发服务器端口：5172

### 样式规范
- 使用 n8n 风格的设计语言
- 数据源节点颜色：`#52C41A`（绿色）
- 选中颜色：`#1890ff`（蓝色）
- 连接线默认灰色：`#999999`

## 修改节点或添加新节点类型

1. 在 `src/utils/node-templates.ts` 中添加节点模板到 `DATA_SOURCE_TEMPLATES` 或 `COMPUTE_TASK_TEMPLATES`
2. 如需新类型枚举，在 `src/types/nodes.ts` 中添加对应的 `Enum`
