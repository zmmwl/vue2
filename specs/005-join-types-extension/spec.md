# Feature Specification: Join 类型扩展

**Feature Branch**: `005-join-types-extension`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "为计算任务增加两种新的join的类型：Union(横向拼接)、和 NoAssoc(无关联)。当前只有两种INNER(内连接)和CROSS(交叉连接)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 配置 Union(横向拼接) 类型的多数据源输入 (Priority: P1)

作为数据工程师，我希望能够使用 Union 方式横向拼接多个数据源的数据，以便将结构相似但来源不同的表合并成一个更大的数据集，而无需指定关联字段。系统需要提供直观的字段对齐界面，让我能够将不同表的字段映射到统一的别名。

**Why this priority**: Union 是数据集成中最常见的操作之一，是本功能的核心价值点，必须优先实现。

**Independent Test**: 可以通过添加两个数据源、选择 Union 类型、配置字段映射、验证输出结果来独立测试。

**Acceptance Scenarios**:

1. **Given** 计算任务节点已添加两个或多个数据源输入, **When** 用户选择 Union 类型作为连接方式, **Then** 系统隐藏 join 字段选择复选框，显示字段对齐配置界面
2. **Given** 用户已选择 Union 类型, **When** 用户在字段对齐界面中拖拽调整字段顺序或设置统一别名, **Then** 系统保存字段映射关系，并在预览中显示对齐后的字段结构
3. **Given** Union 类型已配置完成, **When** 用户尝试同时选择 INNER 类型, **Then** 系统显示错误提示，阻止不兼容的类型共存
4. **Given** 用户配置了 Union 类型, **When** 用户预览或执行任务, **Then** 系统按照配置的字段映射关系横向拼接数据

---

### User Story 2 - 配置 NoAssoc(无关联) 类型的数据源 (Priority: P1)

作为数据工程师，我希望能够将某些数据源标记为"无关联"类型，以便在不需要关联字段的场景下（如单表计算、独立数据处理）跳过 join 字段的必填校验。

**Why this priority**: NoAssoc 是简化配置流程的关键功能，可以显著提升用户体验，与 Union 同等重要。

**Independent Test**: 可以通过添加数据源、选择 NoAssoc 类型、验证无需选择 join 字段即可保存来独立测试。

**Acceptance Scenarios**:

1. **Given** 计算任务节点已添加数据源输入, **When** 用户选择 NoAssoc 类型, **Then** 系统置灰 join 字段选择复选框，去除必填校验
2. **Given** 用户已选择 NoAssoc 类型, **When** 用户保存配置, **Then** 系统允许在不选择任何 join 字段的情况下完成保存
3. **Given** NoAssoc 类型与其他类型（INNER/Union/CROSS）共存, **When** 用户尝试保存配置, **Then** 系统允许保存，因为 NoAssoc 可以与所有类型共存

---

### User Story 3 - 优化 CROSS(交叉连接) 类型的配置体验 (Priority: P2)

作为数据工程师，我希望在选择 CROSS 类型时，系统能够自动跳过 join 字段选择的步骤，因为交叉连接本质上是笛卡尔积，不需要指定关联字段。

**Why this priority**: CROSS 类型已存在，本需求主要是优化用户体验（置灰复选框、去除校验），优先级略低于新类型添加。

**Independent Test**: 可以通过选择 CROSS 类型、验证 join 字段复选框被置灰且无必填校验来独立测试。

**Acceptance Scenarios**:

1. **Given** 计算任务节点已添加数据源输入, **When** 用户选择 CROSS 类型, **Then** 系统置灰 join 字段选择复选框，去除必填校验
2. **Given** 已有一个数据源配置为 CROSS 类型, **When** 用户尝试将另一个数据源也配置为 CROSS 类型, **Then** 系统显示内联警告并禁用保存按钮，提示"只允许一个输入源使用 CROSS(交叉连接)类型"
3. **Given** CROSS 类型与 INNER 或 Union 类型共存, **When** 用户保存配置, **Then** 系统允许保存（CROSS 可以与 INNER 或 Union 共存）

---

### User Story 4 - 类型共存规则校验 (Priority: P2)

作为数据工程师，我希望系统能够自动校验不同 join 类型之间的兼容性，并在用户尝试配置不兼容的组合时给出清晰的错误提示。

**Why this priority**: 类型共存规则是保证数据正确性的关键，需要在前端实时校验，但依赖于前三个故事的实现。

**Independent Test**: 可以通过配置不同类型组合、验证校验逻辑是否正确触发来独立测试。

**Acceptance Scenarios**:

1. **Given** 计算任务中已有 INNER 类型的数据源, **When** 用户尝试添加 Union 类型的数据源, **Then** 系统显示内联警告并禁用保存按钮，提示："Union(横向拼接)与 INNER(内连接)不能共存"
2. **Given** 计算任务中已有 Union 类型的数据源, **When** 用户尝试添加 INNER 类型的数据源, **Then** 系统显示内联警告并禁用保存按钮，提示："INNER(内连接)与 Union(横向拼接)不能共存"
3. **Given** 计算任务中已有 CROSS 类型的数据源, **When** 用户尝试添加另一个 CROSS 类型的数据源, **Then** 系统显示内联警告并禁用保存按钮，提示："只允许一个输入源使用 CROSS(交叉连接)类型"
4. **Given** NoAssoc 类型与任何其他类型组合, **When** 用户保存配置, **Then** 系统允许保存（NoAssoc 可以与所有类型共存）

---

### Edge Cases

- 当用户在 Union 模式下删除某个数据源时，字段映射关系如何处理？（保留已配置的映射，仅移除被删除数据源的字段）
- 当用户切换 join 类型时，自动清除不适用的配置并显示提示，引导用户重新配置
- 当用户从 CROSS/NoAssoc 切换到 INNER 类型时，系统显示内联提示（非模态）："切换到 INNER 类型需要选择 join 字段"，同时高亮显示 join 字段选择区域
- 当 Union 模式下多个数据源的字段数量不一致时如何处理？（允许配置，未映射的字段在输出中以空值填充）
- 当所有数据源都配置为 NoAssoc 类型时，任务如何执行？（每个数据源独立处理，不进行任何关联操作）
- 当混合使用 NoAssoc 和其他类型（INNER/Union/CROSS）时，NoAssoc 数据源独立处理，不参与其他数据源之间的关联操作，单独输出或传递给下游任务
- 多个输入源同时配置时的 UI 布局：每个输入源显示为独立的卡片，支持折叠/展开，按添加顺序排列

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 支持 Union(横向拼接) 类型，允许用户在不指定关联字段的情况下横向拼接多个数据源
- **FR-002**: 系统 MUST 为 Union 类型提供字段对齐配置界面，支持多种交互模式供用户选择：
  - **列对齐模式**：用户拖拽各数据源的列来对齐，类似 Excel 列匹配
  - **逐字段映射模式**：用户创建目标字段，然后为每个数据源选择对应的源字段
  - **表格模式**：行为数据源，列为字段位置，用户在交叉点填写统一别名
  - **实时预览**：每次字段映射变更后 200ms 内更新预览，显示对齐后的字段结构
  - **统一别名**：允许用户为不同表的相同语义字段设置统一别名，别名长度限制 1-64 字符，支持中文、英文、数字和下划线
  - **默认模式**：系统默认选中表格模式（最简单易用）
- **FR-003**: 系统 MUST 支持 NoAssoc(无关联) 类型，当选择此类型时：
  - 置灰 join 字段选择复选框（视觉表现：opacity: 0.5, cursor: not-allowed）
  - 去除必须选择 join 字段的校验
- **FR-004**: 系统 MUST 优化 CROSS(交叉连接) 类型的配置体验：
  - 置灰 join 字段选择复选框（视觉表现：opacity: 0.5, cursor: not-allowed）
  - 去除必须选择 join 字段的校验
- **FR-005**: 系统 MUST 强制执行类型共存规则：
  - Union 与 INNER 不能共存
  - NoAssoc 可以与所有类型共存
  - CROSS 可以与 Union 或 INNER 共存，但只允许一个输入源是 CROSS 类型
  - **校验时机**：类型选择变更时实时校验，不兼容的组合立即显示警告
- **FR-006**: 系统 MUST 在用户尝试配置不兼容的类型组合时显示清晰的错误提示：
  - 在配置区域显示红色内联警告条，说明冲突的具体原因
  - 同时禁用保存按钮，防止错误配置被提交
  - 警告内容应包含具体的类型冲突信息（如"Union(横向拼接)与 INNER(内连接)不能共存"）
- **FR-007**: 系统 MUST 在 InputProviderConfig.vue 中更新 join 类型选择器，支持四种类型：INNER、CROSS、Union、NoAssoc
- **FR-008**: 系统 MUST 更新 FieldMapping 接口的 joinType 字段，支持 'INNER' | 'CROSS' | 'Union' | 'NoAssoc'
- **FR-009**: 系统 MUST 更新 JoinCondition 接口，支持新的 joinType 值
- **FR-010**: 系统 MUST 在 FlowDetailPanel.vue 中正确显示所有四种 join 类型的标签和说明

### Key Entities

- **FieldMapping**: 字段映射配置，新增 joinType 支持 'Union' | 'NoAssoc'
  - columnName: 原始字段名
  - columnAlias: 统一别名（Union 类型下用于字段对齐）
  - columnType: 字段类型
  - isJoinField: 是否为 join 字段（Union/NoAssoc/CROSS 下可为 false）
  - joinType: 连接类型（INNER | CROSS | Union | NoAssoc）
  - mappingOrder?: 字段映射顺序（Union 类型下使用）

- **InputProvider**: 输入数据提供者配置
  - joinType: 该数据源的连接类型（INNER | CROSS | Union | NoAssoc），每个输入源独立设置
  - fieldMappings: Union 类型下的字段映射配置
  - joinFields: join 字段列表（INNER 类型必填，Union/NoAssoc/CROSS 类型可选）

- **UnionFieldMapping**: Union 专用字段映射（新增）
  - targetAlias: 目标统一别名
  - sourceFields: 各数据源对应的源字段

- **JoinCondition**: 连接条件
  - joinType: 连接类型（扩展支持 Union | NoAssoc）
  - operands: 连接操作数（Union/NoAssoc 下可为空）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在 30 秒内完成 Union 类型的选择和基本配置（测量方法：从选择 Union 类型到完成第一个字段映射的时间）
- **SC-002**: 用户可以在 2 分钟内完成 Union 类型下 3 个数据源、每源 10 个字段的字段对齐配置（测量方法：从进入字段对齐界面到点击保存的时间）
- **SC-003**: NoAssoc 和 CROSS 类型的配置步骤比 INNER 类型减少 50%（基准：INNER 类型需要 5 步：选择类型→选择字段→标记 join 字段→设置别名→保存；NoAssoc/CROSS 类型需要 2-3 步）
- **SC-004**: 类型共存规则校验在 100ms 内完成，不阻塞用户操作（测量方法：从类型变更到警告显示的时间）
- **SC-005**: 95% 的用户在没有文档的情况下能够理解四种 join 类型的区别（测量方法：用户测试中正确选择类型的比例）
- **SC-006**: 字段对齐配置界面的操作成功率达到 98%（测量方法：用户首次尝试即能正确完成字段映射并保存的比例）

## Clarifications

### Session 2026-03-01

- Q: join 类型应该应用在哪个层级？ → A: 每个 InputProvider（输入源）级别，每个数据源独立设置 joinType
- Q: Union 字段对齐界面应该采用什么交互模式？ → A: 同时提供多种方式（列对齐、逐字段映射、表格模式），让用户选择偏好的方式
- Q: 当类型共存规则冲突时，错误提示应该如何展示？ → A: 内联警告提示 + 禁用保存按钮
- Q: 当用户切换 join 类型时，已有的配置应该如何处理？ → A: 自动清除不适用的配置 + 提示用户重新配置
- Q: 当混合使用 NoAssoc 和其他类型时，NoAssoc 数据源如何处理？ → A: 独立处理，不参与任何关联，单独输出或传递给下游任务
- Q: 校验应该在什么时机触发？ → A: 实时校验，在类型选择变更时立即校验并显示结果
- Q: 阻止不兼容配置的具体方式是什么？ → A: 显示内联红色警告条并禁用保存按钮，不允许提交不兼容的配置
- Q: 默认使用哪种字段对齐模式？ → A: 表格模式（最简单易用）
- Q: 实时预览的更新延迟是多少？ → A: 200ms 内更新（防抖处理）
- Q: 统一别名的校验规则是什么？ → A: 长度 1-64 字符，支持中文、英文、数字和下划线

## Assumptions

- 用户已了解 SQL 中 UNION 操作的基本概念
- 字段类型兼容性校验将在后续版本中实现，当前版本仅做字段名称和顺序对齐
- Union 模式下的数据去重逻辑将在后端处理，前端仅负责配置界面
- NoAssoc 类型适用于单表计算或独立数据处理的场景，不需要与其他数据源关联
