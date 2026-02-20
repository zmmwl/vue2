# Research: 隐匿查询功能完善与联邦学习任务上线

**Date**: 2026-02-21
**Feature**: 003-pir-fl-enhancement

## 1. PIR实时数据源设计

### Decision
采用"元数据定义"模式，实时数据源只存储字段结构信息，不处理实际数据。

### Rationale
- 平台是流程编排工具，不处理实际传入数据
- 实时数据源的字段信息用于定义未来传入数据的元数据结构
- 实际数据验证由后端执行阶段负责

### Alternatives Considered
1. **实时数据预览模式** - 需要后端支持，违反前端自治原则
2. **纯文本描述模式** - 缺乏结构化，不利于后续验证

### Implementation Pattern
复用现有 `FieldInfo` 类型，扩展来源标识：

```typescript
interface RealtimeDataSourceInfo {
  id: string
  name: string
  sourceType: 'connection' | 'manual'  // 连线导入 or 手工录入
  fields: FieldInfo[]
  sourceNodeId?: string  // 连线导入时的源节点ID
}
```

## 2. 联邦学习菜单三级展开

### Decision
使用CSS hover + Vue transition实现三级菜单展开，复用现有FlowSidebar组件结构。

### Rationale
- 现有侧边栏已实现单级分区结构
- CSS hover性能优于JavaScript事件监听
- Vue transition提供平滑动画效果

### Alternatives Considered
1. **完全重构为树形组件** - 过度设计，增加复杂度
2. **使用第三方菜单库** - 与现有样式体系不兼容

### Implementation Pattern
```vue
<div class="sidebar-section" @mouseenter="expandFLTraining">
  <div class="section-title">联邦学习训练</div>
  <Transition name="slide">
    <div v-if="flTrainingExpanded" class="submenu">
      <div class="submenu-item" @mouseenter="expandType('preprocess')">
        预处理
        <Transition name="slide">
          <div v-if="activeType === 'preprocess'" class="task-list">
            <!-- 具体任务列表 -->
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</div>
```

## 3. FL任务节点类型设计

### Decision
采用统一的FL任务基类 + 任务类型区分模式，而非为每种任务创建独立类型。

### Rationale
- 所有FL任务共享基本的节点行为（拖拽、连接、配置）
- 类型区分通过 `taskCategory` 和 `taskName` 字段实现
- 便于后续扩展新的FL任务类型

### Implementation Pattern
```typescript
interface FLTaskNodeData extends NodeData {
  category: NodeCategory.FL_TASK
  flCategory: 'preprocess' | 'feature_engineering' | 'horizontal' | 'vertical'
  taskName: string  // 具体任务名，如 'logistic_regression'
  mode: 'training' | 'inference'
  parameters: Record<string, any>
  inputProviders?: InputProvider[]
  outputs?: OutputDataConfig[]
}
```

## 4. 参数配置弹窗复用

### Decision
复用现有 `ModelParameterConfig.vue` 的参数配置模式，扩展支持FL任务参数。

### Rationale
- 现有组件已实现字段绑定 vs 固定值切换
- 支持多种数据类型（STRING, INT, FLOAT, BOOLEAN等）
- 参数分组显示模式成熟

### Alternatives Considered
1. **创建全新FL参数配置组件** - 重复造轮子
2. **使用表单生成库** - 与现有样式体系不兼容

### Implementation Pattern
扩展 `ModelParameterSignature` 类型支持FL参数：

```typescript
interface FLTaskParameter {
  name: string
  displayName: string
  dataType: 'select' | 'number' | 'text' | 'boolean' | 'multiselect'
  required: boolean
  defaultValue?: any
  options?: { label: string; value: any }[]  // select类型用
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}
```

## 5. PIR连接限制实现

### Decision
在 `connection-validator.ts` 中添加PIR专用连接规则。

### Rationale
- 现有验证器已实现多种连接限制
- 集中管理连接规则便于维护
- 支持清晰的错误提示

### Implementation Pattern
```typescript
// PIR输出只能连接到PIR任务
if (sourceNode.data.taskType === ComputeTaskType.PIR) {
  if (targetNode.data.taskType !== ComputeTaskType.PIR) {
    return {
      valid: false,
      reason: 'PIR输出只能连接到PIR任务'
    }
  }
}
```

## 6. 已部署模型Mock数据

### Decision
创建Mock数据模拟已部署模型列表，包含训练参与方信息。

### Rationale
- 前端自治原则要求Mock优先
- 模型选择后自动确定推断参与方
- 支持开发测试无后端依赖

### Mock Data Structure
```typescript
const MOCK_DEPLOYED_MODELS: DeployedModel[] = [
  {
    id: 'model_001',
    name: '用户信用评分模型-v1',
    version: '1.0.0',
    type: 'horizontal_lr',
    trainingParticipants: ['ent_001', 'ent_002'],
    createdAt: '2026-02-01'
  }
]
```

## 7. FL任务参数模板存储

### Decision
参数模板存储在 `fl-task-templates.ts` 中，按任务类型组织。

### Rationale
- 前端硬编码参数模板（API获取为后续优化）
- 便于开发调试和参数调整
- 类型安全保证参数正确性

### Template Structure
```typescript
export const FL_TASK_PARAMETER_TEMPLATES: Record<string, FLTaskParameter[]> = {
  'logistic_regression': [
    { name: 'learningRate', displayName: '学习率', dataType: 'number', required: true, defaultValue: 0.01 },
    { name: 'iterations', displayName: '迭代次数', dataType: 'number', required: true, defaultValue: 100 },
    // ...
  ]
}
```

## Summary

| 研究领域 | 决策 | 主要理由 |
|---------|------|---------|
| PIR实时数据源 | 元数据定义模式 | 平台只负责编排 |
| FL菜单展开 | CSS hover + Vue transition | 性能优，复用现有结构 |
| FL节点类型 | 统一基类 + 类型区分 | 便于扩展 |
| 参数配置 | 复用ModelParameterConfig | 避免重复开发 |
| PIR连接限制 | connection-validator扩展 | 集中管理规则 |
| 已部署模型 | Mock数据 | 前端自治 |
| 参数模板 | 前端硬编码 | 类型安全，便于开发 |
