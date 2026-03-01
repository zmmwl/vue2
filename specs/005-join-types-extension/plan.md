# Implementation Plan: Join 类型扩展

**Branch**: `005-join-types-extension` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-join-types-extension/spec.md`

## Summary

为计算任务节点新增 **Union（横向拼接）** 和 **NoAssoc（无关联）** 两种 join 类型，优化 **CROSS（交叉连接）** 的配置体验，并实现类型共存规则校验。技术方案基于现有 Vue 3 + TypeScript 架构，扩展类型定义、更新 UI 组件、新增校验工具函数。

## Technical Context

**Language/Version**: TypeScript 5.9.3 + Vue 3.5.24
**Primary Dependencies**: @vue-flow/core 1.48.1, SCSS 1.97.2, Vite 7.2.4
**Storage**: N/A（前端内存状态）
**Testing**: Playwright 1.57.0, vue-tsc 类型检查
**Target Platform**: 现代浏览器（Chrome, Firefox, Safari, Edge）
**Project Type**: Web 应用（SPA）
**Performance Goals**: 类型共存校验 < 100ms，UI 响应 < 16ms
**Constraints**: 无后端依赖，前端自治
**Scale/Scope**: 4 种 join 类型，3 种字段对齐模式

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. Visual-First Design | ✅ Pass | Union 字段对齐界面采用可视化交互 |
| II. 前端自治原则 | ✅ Pass | 纯前端功能，无需后端支持 |
| III. 标准化输出 | ✅ Pass | 更新导出格式，保持向后兼容 |
| IV. 组件化架构 | ✅ Pass | 新增 UnionFieldAligner 组件，复用现有组件 |
| V. 类型安全 | ✅ Pass | 扩展 TypeScript 类型定义，无 any |

**Post-Design Re-check**: ✅ 所有原则仍然满足

## Project Structure

### Documentation (this feature)

```text
specs/005-join-types-extension/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Research findings
├── data-model.md        # Data model design
├── quickstart.md        # Quick start guide
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── nodes.ts              # [MODIFY] 扩展 JoinType, FieldMapping, InputProvider, JoinCondition
│   └── export.ts             # [MODIFY] 更新导出格式
├── components/
│   ├── Modals/
│   │   ├── InputProviderConfig.vue  # [MODIFY] 更新 join 类型选择器
│   │   └── UnionFieldAligner.vue    # [NEW] Union 字段对齐组件
│   └── Flow/
│       └── FlowDetailPanel.vue      # [MODIFY] 显示新类型标签
├── utils/
│   ├── join-builder.ts       # [MODIFY] 支持 Union/NoAssoc
│   └── join-validation.ts    # [NEW] 类型共存校验
└── composables/
    └── useJoinValidation.ts  # [NEW] 校验 composable

tests/
├── e2e/
│   └── join-types.spec.ts    # [NEW] E2E 测试
└── unit/
    └── join-validation.test.ts # [NEW] 单元测试
```

**Structure Decision**: 单体前端应用，组件遵循现有目录结构

## Implementation Phases

### Phase 1: 类型系统扩展（P1）

**目标**: 更新 TypeScript 类型定义

**修改文件**:
1. `src/types/nodes.ts`
   - 新增 `JoinType` 联合类型
   - 更新 `FieldMapping.joinType`
   - 更新 `InputProvider` 添加 `joinType` 和 `unionFieldMappings`
   - 新增 `UnionFieldMapping` 接口
   - 更新 `JoinCondition.joinType`

2. `src/types/export.ts`
   - 更新导出格式支持新类型

**验收标准**:
- [ ] 类型检查通过（`npm run build`）
- [ ] 无 TypeScript 错误
- [ ] 向后兼容现有数据

### Phase 2: UI 组件更新（P1）

**目标**: 更新 InputProviderConfig.vue 支持四种 join 类型

**修改文件**:
1. `src/components/Modals/InputProviderConfig.vue`
   - 更新 join 类型选择器（4 个选项）
   - NoAssoc/CROSS 时置灰 join 字段复选框
   - 切换类型时自动清除不适用的配置
   - 显示内联警告提示

2. `src/components/Flow/FlowDetailPanel.vue`
   - 显示所有四种类型的标签和说明

**验收标准**:
- [ ] 四种类型都能选择
- [ ] NoAssoc/CROSS 时 join 字段禁用
- [ ] 类型切换时配置正确清除
- [ ] 手动测试通过

### Phase 3: 类型共存校验（P1）

**目标**: 实现类型兼容性校验

**新增文件**:
1. `src/utils/join-validation.ts`
   - 类型兼容性矩阵
   - `validateJoinCompatibility()` 函数
   - CROSS 数量限制检查

2. `src/composables/useJoinValidation.ts`
   - Vue composable 封装
   - 响应式校验结果

**修改文件**:
1. `src/components/Modals/InputProviderConfig.vue`
   - 集成校验逻辑
   - 显示冲突提示
   - 禁用保存按钮

**验收标准**:
- [ ] Union + INNER 冲突检测
- [ ] 多个 CROSS 限制检测
- [ ] 内联警告显示正确
- [ ] 保存按钮禁用/启用正确

### Phase 4: Union 字段对齐界面（P2）

**目标**: 实现 Union 类型的字段对齐配置

**新增文件**:
1. `src/components/Modals/UnionFieldAligner.vue`
   - 模式选择器
   - 实时预览

2. `src/components/Modals/union-align/`
   - `TableMode.vue` - 表格模式
   - `ColumnAlignMode.vue` - 列对齐模式
   - `FieldMappingMode.vue` - 逐字段映射模式

**验收标准**:
- [ ] 三种模式可切换
- [ ] 字段映射正确保存
- [ ] 实时预览显示正确
- [ ] 手动测试通过

### Phase 5: 业务逻辑更新（P2）

**目标**: 更新 join-builder.ts 支持新类型

**修改文件**:
1. `src/utils/join-builder.ts`
   - 处理 Union 类型（生成空 operands）
   - 处理 NoAssoc 类型（生成空 operands）
   - 保持 CROSS 现有逻辑

**验收标准**:
- [ ] Union 条件正确生成
- [ ] NoAssoc 条件正确生成
- [ ] 现有 INNER/CROSS 逻辑不受影响

### Phase 6: 测试（P2）

**目标**: 添加 E2E 和单元测试

**新增文件**:
1. `tests/e2e/join-types.spec.ts`
   - 四种类型选择测试
   - 类型共存校验测试
   - Union 字段对齐测试

2. `tests/unit/join-validation.test.ts`
   - 类型兼容性测试
   - 边界情况测试

**验收标准**:
- [ ] E2E 测试通过
- [ ] 单元测试通过
- [ ] 测试覆盖率 > 80%

## Complexity Tracking

> 无宪章违规需要记录

## Dependencies

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.24 | 响应式框架 |
| @vue-flow/core | 1.48.1 | 流程图编辑 |
| TypeScript | 5.9.3 | 类型安全 |
| Playwright | 1.57.0 | E2E 测试 |

## Risks & Mitigations

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 三种模式开发量大 | 高 | 高 | 优先实现表格模式，其他迭代 |
| 类型切换数据丢失投诉 | 中 | 中 | 提供明确提示，考虑撤销功能 |
| 字段数量多时性能问题 | 低 | 中 | 使用虚拟滚动优化 |

## Next Steps

运行 `/speckit.tasks` 生成详细任务列表。
