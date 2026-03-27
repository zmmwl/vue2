# Research: 联邦学习任务重构

**Date**: 2026-03-27
**Branch**: `006-fl-task-restructure`

## 1. 任务执行类型系统

### Decision
采用三类型枚举：`LOCAL`（单方本地）、`DYNAMIC`（动态）、`MULTI_PARTY`（多方隐私）

### Rationale
- **单方本地任务**：数据清洗、特征编码、特征变换、特征缩放 - 这些操作不涉及跨方数据交换
- **动态任务**：数据采样、特征分箱、特征选择、特征相关性分析 - 根据连接数量决定执行类型
- **多方隐私任务**：所有横向/纵向模型 - 必须涉及多方数据

### Alternatives Considered
1. **两类型系统**（本地/多方）：无法表达动态任务的灵活性，会导致 UI 状态判断复杂
2. **四类型系统**（增加"预处理"类型）：增加不必要的复杂度，预处理任务本身可以是本地或动态

## 2. 子类型参数管理

### Decision
子类型选择后锁定，参数按子类型分组定义，切换子类型需删除节点重建

### Rationale
- 简化状态管理，避免参数继承/重置的复杂逻辑
- 用户明确知道选择了什么类型的操作
- 符合现有 FLTaskConfig.vue 的设计模式

### Alternatives Considered
1. **允许切换子类型**：需要处理参数保留/重置逻辑，增加实现复杂度
2. **子类型作为独立任务**：菜单项过多，用户体验差

## 3. 连接约束验证

### Decision
前端实时验证，阻止非法连接并显示 Toast 提示

### Rationale
- 即时反馈，用户无需等到运行时才发现错误
- 符合前端自治原则
- 与现有连接验证逻辑一致

### Alternatives Considered
1. **允许连接但显示警告**：可能导致用户忽略警告，运行时失败
2. **运行时验证**：用户体验差，需要重新编辑

## 4. 动态任务类型判断

### Decision
根据连接到任务的数据源数量动态判断：
- 1 个数据源 → 单方本地模式
- 2+ 数据源（INNER 连接）→ 多方隐私模式

### Rationale
- 连接数量是最直接的判断依据
- INNER 连接表示多方数据交集，需要隐私保护
- 符合业务语义

### Implementation
```typescript
function determineExecutionType(
  task: FLTaskParameterTemplate,
  connections: number
): FLTaskExecutionType {
  if (task.executionType === FLTaskExecutionType.LOCAL) {
    return FLTaskExecutionType.LOCAL
  }
  if (task.executionType === FLTaskExecutionType.MULTI_PARTY) {
    return FLTaskExecutionType.MULTI_PARTY
  }
  // DYNAMIC: 根据连接数量判断
  return connections > 1
    ? FLTaskExecutionType.MULTI_PARTY
    : FLTaskExecutionType.LOCAL
}
```

## 5. 输出按钮显示规则

### Decision
| 任务类型 | "添加输出"按钮 | 输出配置 |
|---------|--------------|---------|
| 单方本地 | 隐藏 | schema 与输入相同 |
| 动态（单连接） | 隐藏 | schema 与输入相同 |
| 动态（多连接） | 显示 | 可选择输出方和字段 |
| 多方隐私 | 显示 | 可选择输出方和字段 |

### Rationale
- 单方本地任务输出是确定性的（与输入相同），无需配置
- 多方任务输出涉及数据分发，需要明确配置
- 符合用户对"本地操作"和"联邦操作"的直觉理解

## 6. 参数定义来源

### Decision
参数定义基于以下业界标准框架：
- **FATE** (微众银行): 联邦学习任务参数
- **PySyft** (OpenMined): 隐私计算参数
- **TensorFlow Federated**: 分布式训练参数
- **Scikit-learn**: 传统机器学习参数

### Rationale
- 保证参数的业界通用性
- 便于后续与实际后端对接
- 用户对参数含义有参考文档

## 7. API 依赖

### Decision
仅推断任务需要后端 API 获取已部署模型列表

### API Contract
```
GET /api/fl/models?taskType=horizontal&modelType=logistic_regression

Response:
{
  "models": [
    {
      "modelId": "string",
      "modelName": "string",
      "participants": ["string"],
      "createdAt": "string"
    }
  ]
}
```

### Rationale
- 训练任务参数全部前端定义，无需后端
- 推断任务需要选择已训练的模型，必须从后端获取
- 符合最小 API 依赖原则

## 8. 组件复用策略

### Decision
复用现有组件，扩展而非重写

### 可复用组件
| 组件 | 复用方式 |
|------|---------|
| FLTaskConfig.vue | 扩展支持子类型选择 |
| ParameterInput.vue | 直接复用 |
| OutputConfig.vue | 直接复用 |
| FLTaskNode.vue | 扩展输出按钮逻辑 |
| FlowCanvas.vue | 扩展连接验证逻辑 |

### Rationale
- 减少代码重复
- 保持 UI 一致性
- 降低回归风险

## 9. 测试策略

### Decision
采用 Playwright E2E 测试覆盖关键用户流程

### 测试用例
1. 菜单结构验证
2. 子类型选择和参数配置
3. 单方任务连接约束
4. 多方任务连接约束
5. 动态任务类型切换
6. 输出按钮显示/隐藏
7. 参数验证错误提示

### Rationale
- E2E 测试更贴近用户实际操作
- 覆盖组件交互而非孤立组件
- 符合现有测试架构

## References

- [FATE Documentation](https://fate.readthedocs.io/)
- [PySyft Documentation](https://github.com/OpenMined/PySyft)
- [TensorFlow Federated](https://www.tensorflow.org/federated)
- [Vue Flow Documentation](https://vueflow.dev/)
