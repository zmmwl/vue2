# PR Review Checklist: 隐匿查询功能完善与联邦学习任务上线

**Purpose**: 验证需求文档的质量、完整性和一致性 - 这是"需求的单元测试"
**Created**: 2026-02-21
**Scope**: 全功能覆盖 (US1-US6)
**Depth**: PR审查标准
**Focus**: UX/UI需求完整性, 边界条件与异常, API与数据契约

> **核心原则**: 此清单测试**需求本身**的质量，而非实现是否正确。
> ❌ 错误示例: "验证PIR任务可配置实时数据源"
> ✅ 正确示例: "PIR实时数据源配置需求是否明确定义了字段验证规则？"

---

## Requirement Completeness (需求完整性)

### PIR 实时数据源 (US1, US2)

- [ ] CHK001 是否明确定义了"预加载数据源"与"实时数据源"的区别标准？[Clarity, Spec §FR-001]
- [ ] CHK002 实时数据源的字段信息结构（名称、类型、描述）是否有完整的类型定义？[Completeness, Spec §FR-004]
- [ ] CHK003 连线导入和手工录入两种方式的切换逻辑需求是否明确？[Clarity, Spec §FR-003]
- [ ] CHK004 PIR任务接受"一个预加载数据源 + 一个实时数据源"的约束是否在所有相关需求中一致表述？[Consistency, Spec §FR-002]
- [ ] CHK005 PIR输出节点以"实时数据源样式"展示的视觉规范是否定义？[Gap, UX]
- [ ] CHK006 字段映射时"自动加载上游输出字段信息"的具体行为需求是否明确？[Clarity, Spec §US2-3]

### 联邦学习菜单 (US3-US6)

- [ ] CHK007 "联邦学习训练"三级菜单展开的交互时序需求是否完整定义？[Completeness, Spec §FR-008-FR-010]
- [ ] CHK008 "具体任务拖入后才弹窗配置参数"的触发条件是否明确？[Clarity, Spec §FR-010-1]
- [ ] CHK009 四种任务类型（预处理/特征工程/横向模型/纵向模型）的图标和视觉标识是否定义？[Gap, UX]
- [ ] CHK010 "联邦学习推断"菜单的任务类型列表是否与训练菜单一致或有差异？[Consistency, Spec §FR-012]

### FL 预处理任务 (US3)

- [ ] CHK011 预处理任务"只能接入一个数据源"的校验时机和提示信息是否定义？[Completeness, Spec §FR-013]
- [ ] CHK012 预处理任务"不产生额外输出节点"的边界是否在所有场景下明确？[Clarity, Spec §FR-014]
- [ ] CHK013 数据清洗、格式转换、ID标准化三种预处理任务的具体参数是否完整列出？[Completeness, Spec Table]

### FL 特征工程任务 (US4)

- [ ] CHK014 "多参与方多数据源"的最小/最大参与方数量约束是否定义？[Gap, Spec §FR-017]
- [ ] CHK015 特征工程任务生成输出数据节点时，输出节点的字段信息来源是否明确？[Clarity, Spec §FR-018]
- [ ] CHK016 样本对齐、特征选择、特征交叉、归一化四种任务的参数定义是否完整？[Completeness, Spec Table]

### FL 模型任务 (US5)

- [ ] CHK017 横向模型（逻辑回归、XGBoost、CNN、RNN、Transformer）的参数模板是否全部定义？[Completeness, Spec Table]
- [ ] CHK018 纵向模型（SS-LR、SecureBoost、FM、拆分学习）的参数模板是否全部定义？[Completeness, Spec Table]
- [ ] CHK019 "从后端API动态获取参数模板"的失败处理需求是否定义？[Gap, Exception]
- [ ] CHK020 模型任务输出节点的生成规则是否明确？[Clarity, Spec §FR-025]

### FL 推断任务 (US6)

- [ ] CHK021 "从后端API动态获取已部署模型列表"的加载状态和失败处理需求是否定义？[Gap, Exception]
- [ ] CHK022 "选择模型后自动确定推断参与方"的用户可见反馈需求是否明确？[Clarity, Spec §FR-029]
- [ ] CHK023 已部署模型列表为空时的UI状态需求是否定义？[Gap, Edge Case]
- [ ] CHK024 已部署模型被删除后的"重新选择"交互流程是否完整定义？[Completeness, Spec Clarification Q7]

---

## Scenario Coverage (场景覆盖)

### Primary Scenarios (主流程)

- [ ] CHK025 拖拽PIR任务→配置预加载数据源→配置实时数据源的完整流程需求是否覆盖？[Coverage, US1]
- [ ] CHK026 PIR输出→连线到另一个PIR→链式调用的完整流程需求是否覆盖？[Coverage, US2]
- [ ] CHK027 FL任务拖拽→参数配置→节点生成的完整流程需求是否覆盖？[Coverage, US3-US6]

### Alternate Scenarios (备选流程)

- [ ] CHK028 实时数据源从"连线导入"切换到"手工录入"时，已有字段的处理需求是否定义？[Gap, Alternate Flow]
- [ ] CHK029 用户中途取消参数配置弹窗时，节点的状态需求是否定义？[Gap, Alternate Flow]
- [ ] CHK030 修改已配置任务的参数时，重新编辑的交互需求是否定义？[Completeness, Spec §FR-016, FR-020, FR-024, FR-028]

### Exception Scenarios (异常流程)

- [ ] CHK031 实时数据源字段为空时的阻止保存逻辑和提示信息是否明确？[Completeness, Spec Clarification Q2]
- [ ] CHK032 PIR输出连接到非PIR任务时的禁止逻辑和提示信息是否明确？[Completeness, Spec Clarification Q5]
- [ ] CHK033 FL任务参与方不足时的警告内容和禁止保存逻辑是否定义？[Completeness, Spec Clarification Q6]
- [ ] CHK034 已部署模型被删除后的提示内容和重新选择功能是否明确？[Completeness, Spec Clarification Q7]

### Edge Cases (边界条件)

- [ ] CHK035 实时数据源字段数量的上限/下限是否定义？[Gap, Edge Case]
- [ ] CHK036 特征工程任务连接数据源的上限是否定义？[Gap, Edge Case]
- [ ] CHK037 参数配置中数值类型字段的范围约束是否定义？[Gap, Edge Case]
- [ ] CHK038 多层嵌套PIR链式调用（>2层）是否有特殊处理需求？[Gap, Edge Case]

---

## UX/UI Requirements Quality (UX/UI需求质量)

### Visual Design (视觉设计)

- [ ] CHK039 实时数据源节点与预加载数据源节点的视觉区分标准是否定义？[Clarity, UX]
- [ ] CHK040 FL任务节点不同类别（预处理/特征工程/模型/推断）的颜色/图标规范是否定义？[Gap, UX]
- [ ] CHK041 参数配置弹窗的布局、间距、对齐规范是否定义？[Gap, UX]
- [ ] CHK042 "训练模式"与"推断模式"的视觉标识需求是否定义？[Gap, UX]

### Interaction Design (交互设计)

- [ ] CHK043 三级菜单悬停展开的延迟时间和过渡动画需求是否定义？[Clarity, UX]
- [ ] CHK044 拖拽任务到画布的视觉反馈需求是否定义？[Gap, UX]
- [ ] CHK045 连接验证失败时的视觉反馈（连线颜色、图标等）是否定义？[Gap, UX]
- [ ] CHK046 参数保存成功/失败的反馈机制是否定义？[Gap, UX]

### Accessibility (无障碍)

- [ ] CHK047 键盘导航（Tab键、Enter键）在三级菜单中的行为需求是否定义？[Gap, A11y]
- [ ] CHK048 参数配置弹窗的焦点管理需求是否定义？[Gap, A11y]
- [ ] CHK049 错误提示的无障碍支持（aria-label等）是否定义？[Gap, A11y]

### Responsive Design (响应式)

- [ ] CHK050 参数配置弹窗在小屏幕下的适配需求是否定义？[Gap, Responsive]
- [ ] CHK051 侧边栏菜单在窄屏下的折叠行为是否定义？[Gap, Responsive]

---

## API & Data Contracts (API与数据契约)

### Mock Data Structure (Mock数据结构)

- [ ] CHK052 已部署模型(DeployedModel)的数据结构是否与API契约一致？[Consistency, contracts/api-contracts.md]
- [ ] CHK053 FL任务参数模板(FLTaskParameterTemplate)的数据结构是否与spec定义一致？[Consistency, Spec Table + contracts]
- [ ] CHK054 Mock数据的字段类型是否与TypeScript类型定义一致？[Consistency, data-model.md]

### API Error Handling (API错误处理)

- [ ] CHK055 获取已部署模型列表API失败时的前端处理需求是否定义？[Gap, Exception]
- [ ] CHK056 获取参数模板API失败时的前端处理需求是否定义？[Gap, Exception]
- [ ] CHK057 API超时的重试策略需求是否定义？[Gap, Exception]

### Data Validation (数据验证)

- [ ] CHK058 实时数据源字段类型的校验规则是否定义？[Gap, Validation]
- [ ] CHK059 参数配置中必填字段的验证逻辑是否与spec中的"必填"标记一致？[Consistency, Spec Table]
- [ ] CHK060 参数值范围（如learningRate的合理范围）是否定义？[Gap, Validation]

---

## Acceptance Criteria Quality (验收标准质量)

### Measurability (可测量性)

- [ ] CHK061 "30秒内完成PIR实时数据源字段配置"的测量方法是否定义？[Measurability, Spec §SC-001]
- [ ] CHK062 "100%的PIR任务支持链式调用"的验证方法是否定义？[Measurability, Spec §SC-002]
- [ ] CHK063 "1分钟内完成FL任务参数配置"的测量方法是否定义？[Measurability, Spec §SC-004]
- [ ] CHK064 "95%用户能够独立完成流程"的测量方法是否定义？[Measurability, Spec §SC-007]

### Testability (可测试性)

- [ ] CHK065 每个用户故事的验收场景是否可以独立测试？[Testability, Spec §US1-US6]
- [ ] CHK066 E2E测试用例是否可以从验收场景直接导出？[Testability, tasks.md T035-T036]

---

## Dependencies & Assumptions (依赖与假设)

### External Dependencies (外部依赖)

- [ ] CHK067 后端API可用性假设是否在文档中明确标注？[Assumption, plan.md]
- [ ] CHK068 已部署模型数据来源的假设是否明确？[Assumption, Spec Clarification Q1]
- [ ] CHK069 参数模板API的接口契约是否与前端Mock数据结构一致？[Consistency, contracts/api-contracts.md]

### Platform Boundaries (平台边界)

- [ ] CHK070 "本平台只负责流程编排，不处理实际传入数据"的边界是否在所有相关需求中一致体现？[Consistency, Spec Clarification Q8]
- [ ] CHK071 数据验证由后端执行阶段的假设是否在文档中明确？[Assumption, Spec §Edge Cases]

---

## Ambiguities & Conflicts (歧义与冲突)

### Terminology (术语歧义)

- [ ] CHK072 "实时数据源"在不同上下文中的含义是否一致？[Consistency]
- [ ] CHK073 "参与方"在训练和推断上下文中的定义是否一致？[Consistency]
- [ ] CHK074 "已部署模型"与"训练完成的模型"是否为同一概念？[Clarity]

### Requirement Conflicts (需求冲突)

- [ ] CHK075 FR-003"支持连线导入"与FR-006"PIR输出作为下游PIR输入"是否可能产生冲突场景？[Conflict Check]
- [ ] CHK076 FR-014"预处理不产生输出节点"与特征工程/模型需要输入的依赖关系是否明确？[Consistency Check]

### Missing Definitions (缺失定义)

- [ ] CHK077 "配置完成"的具体判定标准是否定义？[Gap]
- [ ] CHK078 "参与方不足"的具体数量标准是否定义？[Gap, Spec Clarification Q6]
- [ ] CHK079 "参数配置正常"的判定标准是否定义？[Gap]

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Items | 79 |
| Requirement Completeness | 24 |
| Scenario Coverage | 13 |
| UX/UI Requirements Quality | 13 |
| API & Data Contracts | 9 |
| Acceptance Criteria Quality | 2 |
| Dependencies & Assumptions | 5 |
| Ambiguities & Conflicts | 8 |
| Gap Items (missing requirements) | 35 |
| Consistency Items | 12 |
| Clarity Items | 15 |
| Measurability Items | 4 |

---

## Review Instructions

1. **For each item**: Check if the corresponding requirement is present, clear, and testable
2. **Mark as complete**: When the requirement quality is satisfactory
3. **Create follow-up tasks**: For any [Gap] items that need spec clarification
4. **Note conflicts**: For any [Conflict] items that need resolution

**Reminder**: This checklist validates **requirement quality**, not implementation correctness.
