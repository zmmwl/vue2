# Research: 隐私计算任务算法选择

**Date**: 2026-02-28
**Feature**: 004-algorithm-selection

## 研究结论

### 1. 算法类型与技术路径映射

**Decision**: 算法类型区分技术路径，与任务节点的computeType一一对应。

**Types**:
- PSI / TEE_PSI - 隐私集合求交
- PIR / TEE_PIR - 隐私信息检索
- MPC / TEE_MPC - 多方安全计算
- FL / TEE_FL - 联邦学习

**Rationale**: 技术路径（软件密码学 vs 硬件TEE）决定了算法的实现方式，软件版和TEE版算法不兼容，必须区分。

**Alternatives Considered**:
- 不区分技术路径 - 拒绝，因为实际执行时软件和TEE算法不兼容

### 2. 算法ID生成规则

**Decision**: 使用"英文名称-版本号"格式作为唯一标识符。

**Format**: `{name}-{version}` (如 `SPDZ-v1.0`, `ABY3-v2.1`)

**Rationale**:
- 业务可读性强，便于调试和日志追踪
- 版本号显式包含在ID中，避免混淆
- 符合用户直觉，易于理解和记忆

**Alternatives Considered**:
- UUID - 拒绝，缺乏业务语义
- 自增整数 - 拒绝，跨环境不兼容

### 3. 算法配置在JSON中的位置

**Decision**: 算法配置从属于task，作为任务对象的字段。

**Structure**:
```json
{
  "taskList": [{
    "taskId": "task-001",
    "computeType": "MPC",
    "algorithmId": "SPDZ-v1.0",
    "algorithmName": "SPDZ协议算法",
    "algorithmVersion": "v1.0",
    "algorithmParams": {
      "iterationCount": 100,
      "securityLevel": "high"
    },
    "...": "其他任务字段"
  }]
}
```

**Rationale**: 算法是任务的执行实现，从属于任务是自然的业务模型。

**Alternatives Considered**:
- 放在modelProviderList中 - 拒绝，算法与模型是不同概念
- 作为顶级字段 - 拒绝，破坏任务封装性

### 4. 参数模板切换逻辑

**Decision**: 切换算法时始终清空已填写的参数值。

**Rationale**:
- 每个算法有独立的参数模板（可能为空）
- 不同算法的参数结构必然不同
- 保留旧值可能导致语义错误

**Implementation**: 选择新算法时，清空algorithmParams，根据新算法的paramTemplate重新生成表单。

### 5. Mock数据结构

**Decision**: 预置10-15条算法数据，覆盖8种算法类型。

**Distribution**:
- PSI: 1-2条
- TEE_PSI: 1条
- PIR: 1-2条
- TEE_PIR: 1条
- MPC: 2-3条（最常用）
- TEE_MPC: 1-2条
- FL: 1-2条
- TEE_FL: 1条

**Rationale**: MPC类型最常用，预置更多选项；其他类型保证每种至少1条用于测试。

### 6. 算法包文件处理

**Decision**: Mock场景下不实现算法包上传功能，仅保留UI入口。

**Rationale**:
- 纯前端项目，无法处理二进制文件
- Mock场景下算法包字段为空或占位值
- 预留UI入口便于后续真实实现

### 7. 参数模板类型系统

**Decision**: 支持8种参数类型和5种验证规则。

**Parameter Types**:
| Type | UI Control | Example |
|------|------------|---------|
| string | 文本输入框 | 服务器地址 |
| integer | 数字输入框 | 迭代次数 |
| float | 数字输入框 | 学习率 |
| boolean | 开关 | 是否启用加密 |
| enum | 下拉选择框 | 加密模式(AES/SM4) |
| date | 日期选择器 | 过期日期 |
| json | JSON编辑器 | 高级配置 |
| array | 列表编辑器 | 服务器列表 |

**Validation Rules**:
| Rule | Applies To | Example |
|------|------------|---------|
| required | all | 必填 |
| minLength/maxLength | string | 1-100字符 |
| min/max | integer, float | 0-1000 |
| pattern | string | 正则验证 |
| enumOptions | enum | 可选值列表 |

### 8. 默认算法选择逻辑

**Decision**: 选择创建时间最新的匹配算法。

**Algorithm**:
1. 根据任务类型(computeType)过滤算法列表
2. 按创建时间降序排序
3. 选择第一条（最新）

**Rationale**: 最新注册的算法通常是经过优化的版本，更适合作为默认选择。

**Alternatives Considered**:
- 选择使用次数最多的 - 拒绝，需要额外统计，增加复杂度
- 选择名称字母序第一的 - 拒绝，无业务意义

### 9. 导航设计

**Decision**: 通过Header右侧"设置"下拉菜单进入算法管理独立页面。

**Flow**:
1. 点击Header右侧"设置"按钮
2. 下拉菜单显示"算法管理"选项
3. 点击后路由跳转到 `/algorithm-manager`
4. 算法管理页面左上角有"返回"按钮

**Rationale**:
- 算法管理是低频操作，放入下拉菜单合理
- 独立页面提供完整的管理空间
- 与流程编辑器功能分离，避免界面拥挤

### 10. 与现有代码集成

**Decision**: 扩展现有服务层和组件，保持架构一致性。

**Integration Points**:
| 现有模块 | 集成方式 |
|---------|---------|
| `useGraphState.ts` | 扩展节点状态包含算法配置 |
| `dag-export.ts` | 扩展导出逻辑包含算法字段 |
| `FlowDetailPanel.vue` | 添加算法选择和参数配置section |
| `ComputeTaskNode.vue` | 显示已选算法名称 |
| `FlowHeader.vue` | 设置按钮改为下拉菜单 |

**Rationale**: 复用现有架构模式，减少学习成本，保持代码一致性。
