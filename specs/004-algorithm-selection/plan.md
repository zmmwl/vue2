# Implementation Plan: 隐私计算任务算法选择

**Branch**: `004-algorithm-selection` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-algorithm-selection/spec.md`

## Summary

为隐私计算流程编辑器添加算法选择功能，包含两个核心模块：
1. **算法配置管理** - 提供算法的CRUD管理界面，支持参数模板定义
2. **任务算法编排** - 在DAG流程编排时自动/手动选择算法，动态生成参数表单

技术方案：基于现有Vue 3 + TypeScript + @vue-flow/core架构，新增算法管理服务层、算法管理页面、参数模板编辑器组件，扩展任务节点详情面板以支持算法选择和参数配置。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: Vue 3.5.24, @vue-flow/core 1.48.1, Vite 7.2.4, SCSS 1.97.2, Playwright 1.57.0
**Storage**: 内存存储（Map缓存）+ JSON文件导入导出
**Testing**: Playwright 1.57.0 + vue-tsc 类型检查
**Target Platform**: Web浏览器（Chrome, Firefox, Edge）+ Electron桌面应用
**Project Type**: web-app（前端单页应用）
**Performance Goals**: 1秒内完成默认算法匹配，2秒内加载算法管理界面，参数验证延迟<500ms
**Constraints**: 纯前端实现，Mock API，内存存储（刷新丢失），算法包上传暂不实现
**Scale/Scope**: 支持100条算法记录，预置10-15条Mock数据，8种算法类型

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Visual-First Design** | ✅ Pass | 算法选择集成到任务节点详情面板，参数表单动态生成，提供可视化交互 |
| **II. Frontend Autonomy** | ✅ Pass | 所有算法API使用Mock实现，无需后端服务即可开发和测试 |
| **III. Standardized Output** | ✅ Pass | 算法配置作为task字段导出到JSON，有明确的TypeScript类型定义 |
| **IV. Componentized Architecture** | ✅ Pass | 新增组件独立封装（AlgorithmManager、ParamTemplateEditor、AlgorithmSelector） |
| **V. Type Safety** | ✅ Pass | 所有新增代码使用TypeScript，定义明确的接口类型 |

**Gate Status**: ✅ PASSED - 所有原则符合，无需豁免

## Project Structure

### Documentation (this feature)

```text
specs/004-algorithm-selection/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 API合约
│   └── algorithm-api.md # 算法API接口定义
└── tasks.md             # Phase 2 任务列表
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── algorithm.ts           # [NEW] 算法相关类型定义
│   └── nodes.ts               # [MODIFY] 扩展任务节点类型
├── services/
│   └── algorithmService.ts    # [NEW] 算法管理Mock服务
├── utils/
│   ├── algorithm-mock-data.ts # [NEW] 算法Mock数据
│   └── dag-export.ts          # [MODIFY] 扩展导出逻辑包含算法配置
├── composables/
│   └── useAlgorithmState.ts   # [NEW] 算法状态管理
├── views/
│   ├── FlowEditor.vue         # [MODIFY] 添加设置下拉菜单
│   └── AlgorithmManager.vue   # [NEW] 算法管理页面
├── components/
│   ├── Flow/
│   │   ├── FlowHeader.vue     # [MODIFY] 设置按钮改为下拉菜单
│   │   └── FlowDetailPanel.vue # [MODIFY] 添加算法选择和参数配置
│   ├── Algorithm/
│   │   ├── AlgorithmList.vue       # [NEW] 算法列表组件
│   │   ├── AlgorithmForm.vue       # [NEW] 算法注册表单
│   │   ├── AlgorithmSelector.vue   # [NEW] 算法选择下拉组件
│   │   ├── ParamTemplateEditor.vue # [NEW] 参数模板编辑器
│   │   └── DynamicParamForm.vue    # [NEW] 动态参数表单
│   └── Nodes/
│       └── ComputeTaskNode.vue # [MODIFY] 显示已选算法信息
└── router/
    └── index.ts               # [NEW] Vue Router配置，添加算法管理路由

tests/
├── mocks/
│   └── algorithmMock.ts       # [NEW] 算法测试Mock
└── e2e/
    └── algorithm.spec.ts      # [NEW] 算法功能E2E测试
```

**Structure Decision**: 采用现有单项目结构，新增Algorithm组件目录和服务层。路由使用Vue Router实现算法管理独立页面。

## Complexity Tracking

> 无宪章违规需要豁免

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Implementation Phases

### Phase 0: Research (已完成)

研究内容已在规格澄清阶段完成：
- 算法类型与技术路径的关系
- 导出JSON中算法配置的位置
- 参数模板切换逻辑
- Mock数据结构设计

### Phase 1: Design Artifacts

待生成：
- [ ] `research.md` - 研究结论
- [ ] `data-model.md` - 数据模型定义
- [ ] `contracts/algorithm-api.md` - API接口合约
- [ ] `quickstart.md` - 快速开始指南

### Phase 2: Task Generation

运行 `/speckit.tasks` 生成任务列表
