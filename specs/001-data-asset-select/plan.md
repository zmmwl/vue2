# Implementation Plan: 数据资产选择与展示

**Branch**: `001-data-asset-select` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-data-asset-select/spec.md`

## Summary

实现数据资产选择与展示功能，使用户在拖拽数据源节点到画布后，能够通过多步骤向导选择具体的数据资产（企业 → 资产 → 字段），并在右侧详情面板中查看已配置的数据资产信息。所有选择结果将包含在导出的 JSON 任务图中。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Vue 3.5.24
**Primary Dependencies**: @vue-flow/core 1.48.1, Vite 7.2.4, Sass 1.97.2, Playwright 1.57.0
**Storage**: 内存存储（Map 缓存） + JSON 文件导入导出
**Testing**: Playwright (E2E), vue-tsc (类型检查)
**Target Platform**: 现代浏览器（Chrome >= 90, Edge >= 90, Firefox >= 88, Safari >= 14）
**Project Type**: Web application (SPA)
**Performance Goals**:
  - 数据资产配置流程 < 30 秒
  - 搜索过滤响应 < 1 秒（>20 项时）
  - API 请求超时阈值 10 秒
**Constraints**:
  - 单个数据资产最多 500 个字段（需要虚拟滚动）
  - 所有后端接口必须有 Mock 实现
  - 节点 data 必须存储完整资产信息（用于导出）
**Scale/Scope**:
  - 3 个新组件（AssetSelectorDialog, AssetDetailPanel, VirtualScrollList）
  - 2 个 API 服务（assetApi, assetCache）
  - 5 个新类型定义
  - 1 个导出/导入模块扩展

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Visual-First Design** | ✅ PASS | 多步骤向导界面，拖放后自动弹出对话框，右侧详情面板实时展示，节点标题旁显示已选资产名称 |
| **II. 前端自治原则** | ✅ PASS | 所有 API 调用（asset/GetEnterpriseList、asset/GetAsset）必须有 Mock 实现，支持离线开发 |
| **III. 标准化输出** | ✅ PASS | 导出 JSON 格式在 types/nodes.ts 中定义（AssetInfo 接口），包含完整资产信息，支持向后兼容 |
| **IV. 组件化架构** | ✅ PASS | 新组件独立封装：AssetSelectorDialog（对话框）、AssetDetailPanel（详情面板）、VirtualScrollList（虚拟滚动列表） |
| **V. 类型安全** | ✅ PASS | 无 any 类型，新增 AssetInfo、SelectedField、Enterprise 等接口定义在 types/nodes.ts |

**Development Standards Compliance**:
- ✅ 使用 Vue 3 Composition API + `<script setup>` 语法
- ✅ 样式使用 SCSS，变量统一定义在 assets/styles/variables.scss
- ✅ 遵循 n8n 设计语言风格
- ✅ 文件组织符合项目结构（components/、types/、utils/）

**Testing Standards Compliance**:
- ✅ 使用 Playwright 测试关键用户交互流程（拖放 → 选择 → 查看详情 → 导出）
- ✅ 类型检查：vue-tsc -b 在构建前执行
- ✅ Mock 数据定义在 tests/mocks/ 目录

**Gate Result**: ✅ **ALL CHECKS PASSED** - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-data-asset-select/
├── plan.md              # This file
├── research.md          # Phase 0 output (技术调研与决策)
├── data-model.md        # Phase 1 output (数据模型设计)
├── quickstart.md        # Phase 1 output (快速开始指南)
├── contracts/           # Phase 1 output (API 契约)
│   ├── api-contract.ts  # API 接口定义
│   └── openapi.yaml     # OpenAPI 规范（可选）
└── tasks.md             # Phase 2 output (由 /speckit.tasks 生成，不在本阶段)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Flow/
│   │   ├── FlowHeader.vue       # 扩展：添加导出/导入按钮
│   │   ├── FlowSidebar.vue      # 现有：拖拽源
│   │   ├── FlowCanvas.vue       # 修改：drop 后弹出对话框
│   │   └── FlowDetailPanel.vue  # 新增：右侧详情面板
│   ├── Dialogs/
│   │   └── AssetSelectorDialog.vue  # 新增：数据资产选择对话框（向导）
│   ├── Nodes/
│   │   └── DataSourceNode.vue   # 修改：显示已选资产名称
│   └── Common/
│       └── VirtualScrollList.vue # 新增：虚拟滚动列表组件
├── types/
│   ├── nodes.ts                 # 扩展：添加 AssetInfo、SelectedField 等接口
│   └── api.ts                   # 新增：API 响应类型定义
├── services/
│   ├── assetApi.ts              # 新增：数据资产 API 服务
│   └── assetCache.ts            # 新增：资产缓存服务
├── utils/
│   ├── exportUtils.ts           # 新增：导出/导入工具函数
│   └── logger.ts                # 新增：日志工具
└── tests/
    └── mocks/
        ├── assetApiMock.ts      # 新增：API Mock 实现
        └── assetTestData.ts     # 新增：测试数据

tests/e2e/
└── asset-selection.spec.ts      # 新增：E2E 测试用例
```

**Structure Decision**: 单页应用 (SPA) 架构，与现有项目结构一致。新增组件按功能分类到对应目录（Dialogs、Common），服务层统一放在 services/，类型定义扩展 types/ 目录。

## Complexity Tracking

> **No violations - Complexity Tracking not required**

All Constitution Check items passed without violations. The design follows established patterns:
- Dialog component follows existing modal patterns
- Cache service uses simple Map structure
- Virtual scrolling is a standard optimization technique
- No additional dependencies beyond current stack
