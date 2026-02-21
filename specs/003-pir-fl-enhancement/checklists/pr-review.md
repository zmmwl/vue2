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

- [X] CHK001 是否明确定义了"预加载数据源"与"实时数据源"的区别标准？[✓ Spec §FR-001, Key Entities]
- [X] CHK002 实时数据源的字段信息结构（名称、类型、描述）是否有完整的类型定义？[✓ Spec §FR-004]
- [X] CHK003 连线导入和手工录入两种方式的切换逻辑需求是否明确？[✓ Interaction Specifications]
- [X] CHK004 PIR任务接受"一个预加载数据源 + 一个实时数据源"的约束是否在所有相关需求中一致表述？[✓ Spec §FR-002]
- [X] CHK005 PIR输出节点以"实时数据源样式"展示的视觉规范是否定义？[✓ NFR-VD-002]
- [X] CHK006 字段映射时"自动加载上游输出字段信息"的具体行为需求是否明确？[✓ Spec §US2-3]

### 联邦学习菜单 (US3-US6)

- [X] CHK007 "联邦学习训练"三级菜单展开的交互时序需求是否完整定义？[✓ Spec §FR-008-FR-010, NFR-VD-005]
- [X] CHK008 "具体任务拖入后才弹窗配置参数"的触发条件是否明确？[✓ Spec §FR-010-1]
- [X] CHK009 四种任务类型（预处理/特征工程/横向模型/纵向模型）的图标和视觉标识是否定义？[✓ NFR-VD-003]
- [X] CHK010 "联邦学习推断"菜单的任务类型列表是否与训练菜单一致或有差异？[✓ Spec §FR-012 - 一致，四种类型]

### FL 预处理任务 (US3)

- [X] CHK011 预处理任务"只能接入一个数据源"的校验时机和提示信息是否定义？[✓ Spec §FR-013 + Edge Cases]
- [X] CHK012 预处理任务"不产生额外输出节点"的边界是否在所有场景下明确？[✓ Spec §FR-014]
- [X] CHK013 数据清洗、格式转换、ID标准化三种预处理任务的具体参数是否完整列出？[✓ Spec Table - 预处理任务参数]

### FL 特征工程任务 (US4)

- [X] CHK014 "多参与方多数据源"的最小/最大参与方数量约束是否定义？[✓ NFR-EC-004, NFR-EC-005]
- [X] CHK015 特征工程任务生成输出数据节点时，输出节点的字段信息来源是否明确？[✓ Spec §FR-018 - 处理后字段列表]
- [X] CHK016 样本对齐、特征选择、特征交叉、归一化四种任务的参数定义是否完整？[✓ Spec Table - 特征工程任务参数]

### FL 模型任务 (US5)

- [X] CHK017 横向模型（逻辑回归、XGBoost、CNN、RNN、Transformer）的参数模板是否全部定义？[✓ Spec Table - 横向模型任务参数]
- [X] CHK018 纵向模型（SS-LR、SecureBoost、FM、拆分学习）的参数模板是否全部定义？[✓ Spec Table - 纵向模型任务参数]
- [X] CHK019 "从后端API动态获取参数模板"的失败处理需求是否定义？[✓ NFR-API-002]
- [X] CHK020 模型任务输出节点的生成规则是否明确？[✓ Spec §FR-025]

### FL 推断任务 (US6)

- [X] CHK021 "从后端API动态获取已部署模型列表"的加载状态和失败处理需求是否定义？[✓ NFR-API-001]
- [X] CHK022 "选择模型后自动确定推断参与方"的用户可见反馈需求是否明确？[✓ Spec §FR-029 + NFR-VD-008]
- [X] CHK023 已部署模型列表为空时的UI状态需求是否定义？[✓ NFR-API-004]
- [X] CHK024 已部署模型被删除后的"重新选择"交互流程是否完整定义？[✓ Spec Edge Cases + Clarification Q7]

---

## Scenario Coverage (场景覆盖)

### Primary Scenarios (主流程)

- [X] CHK025 拖拽PIR任务→配置预加载数据源→配置实时数据源的完整流程需求是否覆盖？[✓ Spec §US1 Acceptance Scenarios]
- [X] CHK026 PIR输出→连线到另一个PIR→链式调用的完整流程需求是否覆盖？[✓ Spec §US2 Acceptance Scenarios]
- [X] CHK027 FL任务拖拽→参数配置→节点生成的完整流程需求是否覆盖？[✓ Spec §US3-US6 Acceptance Scenarios]

### Alternate Scenarios (备选流程)

- [X] CHK028 实时数据源从"连线导入"切换到"手工录入"时，已有字段的处理需求是否定义？[✓ Interaction Specifications - 数据源切换行为]
- [X] CHK029 用户中途取消参数配置弹窗时，节点的状态需求是否定义？[✓ Interaction Specifications - 弹窗取消行为]
- [X] CHK030 修改已配置任务的参数时，重新编辑的交互需求是否定义？[✓ Interaction Specifications - 参数重新编辑]

### Exception Scenarios (异常流程)

- [X] CHK031 实时数据源字段为空时的阻止保存逻辑和提示信息是否明确？[✓ Spec Edge Cases + Clarification Q2]
- [X] CHK032 PIR输出连接到非PIR任务时的禁止逻辑和提示信息是否明确？[✓ Spec Edge Cases + NFR-VD-007]
- [X] CHK033 FL任务参与方不足时的警告内容和禁止保存逻辑是否定义？[✓ Spec Edge Cases + NFR-EC-004, NFR-EC-005]
- [X] CHK034 已部署模型被删除后的提示内容和重新选择功能是否明确？[✓ Spec Edge Cases + Clarification Q7]

### Edge Cases (边界条件)

- [X] CHK035 实时数据源字段数量的上限/下限是否定义？[✓ NFR-EC-001]
- [X] CHK036 特征工程任务连接数据源的上限是否定义？[✓ NFR-EC-004]
- [X] CHK037 参数配置中数值类型字段的范围约束是否定义？[✓ NFR-EC-007~010]
- [X] CHK038 多层嵌套PIR链式调用（>2层）是否有特殊处理需求？[✓ NFR-EC-006]

---

## UX/UI Requirements Quality (UX/UI需求质量)

### Visual Design (视觉设计)

- [X] CHK039 实时数据源节点与预加载数据源节点的视觉区分标准是否定义？[✓ NFR-VD-001]
- [X] CHK040 FL任务节点不同类别（预处理/特征工程/模型/推断）的颜色/图标规范是否定义？[✓ NFR-VD-003]
- [X] CHK041 参数配置弹窗的布局、间距、对齐规范是否定义？[✓ Interaction Specifications - 弹窗布局规范]
- [X] CHK042 "训练模式"与"推断模式"的视觉标识需求是否定义？[✓ NFR-VD-004]

### Interaction Design (交互设计)

- [X] CHK043 三级菜单悬停展开的延迟时间和过渡动画需求是否定义？[✓ NFR-VD-005]
- [X] CHK044 拖拽任务到画布的视觉反馈需求是否定义？[✓ NFR-VD-006]
- [X] CHK045 连接验证失败时的视觉反馈（连线颜色、图标等）是否定义？[✓ NFR-VD-007]
- [X] CHK046 参数保存成功/失败的反馈机制是否定义？[✓ NFR-VD-008]

### Accessibility (无障碍)

- [X] CHK047 键盘导航（Tab键、Enter键）在三级菜单中的行为需求是否定义？[✓ NFR-A11Y-001]
- [X] CHK048 参数配置弹窗的焦点管理需求是否定义？[✓ NFR-A11Y-002, NFR-A11Y-003]
- [X] CHK049 错误提示的无障碍支持（aria-label等）是否定义？[✓ NFR-A11Y-004, NFR-A11Y-005]

### Responsive Design (响应式)

- [X] CHK050 参数配置弹窗在小屏幕下的适配需求是否定义？[✓ NFR-RWD-001]
- [X] CHK051 侧边栏菜单在窄屏下的折叠行为是否定义？[✓ NFR-RWD-002]

---

## API & Data Contracts (API与数据契约)

### Mock Data Structure (Mock数据结构)

- [X] CHK052 已部署模型(DeployedModel)的数据结构是否与API契约一致？[✓ contracts/api-contracts.md §DeployedModel]
- [X] CHK053 FL任务参数模板(FLTaskParameterTemplate)的数据结构是否与spec定义一致？[✓ contracts/api-contracts.md §FLTaskParameterTemplate]
- [X] CHK054 Mock数据的字段类型是否与TypeScript类型定义一致？[✓ data-model.md 与 contracts 一致]

### API Error Handling (API错误处理)

- [X] CHK055 获取已部署模型列表API失败时的前端处理需求是否定义？[✓ NFR-API-001]
- [X] CHK056 获取参数模板API失败时的前端处理需求是否定义？[✓ NFR-API-002]
- [X] CHK057 API超时的重试策略需求是否定义？[✓ NFR-API-003]

### Data Validation (数据验证)

- [X] CHK058 实时数据源字段类型的校验规则是否定义？[✓ Interaction Specifications - 字段类型校验规则]
- [X] CHK059 参数配置中必填字段的验证逻辑是否与spec中的"必填"标记一致？[✓ Spec Tables 明确标记必填]
- [X] CHK060 参数值范围（如learningRate的合理范围）是否定义？[✓ NFR-EC-007~010]

---

## Acceptance Criteria Quality (验收标准质量)

### Measurability (可测量性)

- [X] CHK061 "30秒内完成PIR实时数据源字段配置"的测量方法是否定义？[✓ Success Criteria Measurement Methods]
- [X] CHK062 "100%的PIR任务支持链式调用"的验证方法是否定义？[✓ Success Criteria Measurement Methods]
- [X] CHK063 "1分钟内完成FL任务参数配置"的测量方法是否定义？[✓ Success Criteria Measurement Methods]
- [X] CHK064 "95%用户能够独立完成流程"的测量方法是否定义？[✓ Success Criteria Measurement Methods]

### Testability (可测试性)

- [X] CHK065 每个用户故事的验收场景是否可以独立测试？[✓ Spec §US1-US6 每个故事独立验收场景]
- [X] CHK066 E2E测试用例是否可以从验收场景直接导出？[✓ tasks.md T035-T036 E2E测试任务]

---

## Dependencies & Assumptions (依赖与假设)

### External Dependencies (外部依赖)

- [X] CHK067 后端API可用性假设是否在文档中明确标注？[✓ plan.md Technical Context]
- [X] CHK068 已部署模型数据来源的假设是否明确？[✓ Spec Clarification Q1]
- [X] CHK069 参数模板API的接口契约是否与前端Mock数据结构一致？[✓ contracts/api-contracts.md 定义一致]

### Platform Boundaries (平台边界)

- [X] CHK070 "本平台只负责流程编排，不处理实际传入数据"的边界是否在所有相关需求中一致体现？[✓ Spec Edge Cases 注释 + Clarification Q8]
- [X] CHK071 数据验证由后端执行阶段的假设是否在文档中明确？[✓ Spec Edge Cases 注释]

---

## Ambiguities & Conflicts (歧义与冲突)

### Terminology (术语歧义)

- [X] CHK072 "实时数据源"在不同上下文中的含义是否一致？[✓ Key Entities 定义一致]
- [X] CHK073 "参与方"在训练和推断上下文中的定义是否一致？[✓ Key Entities - 推断参与方须与训练一致]
- [X] CHK074 "已部署模型"与"训练完成的模型"是否为同一概念？[✓ Key Entities - 已部署模型包含训练参与方信息]

### Requirement Conflicts (需求冲突)

- [X] CHK075 FR-003"支持连线导入"与FR-006"PIR输出作为下游PIR输入"是否可能产生冲突场景？[✓ 无冲突 - 连线导入包含PIR输出连线]
- [X] CHK076 FR-014"预处理不产生输出节点"与特征工程/模型需要输入的依赖关系是否明确？[✓ 无冲突 - 预处理是本地任务，不参与后续流程]

### Missing Definitions (缺失定义)

- [X] CHK077 "配置完成"的具体判定标准是否定义？[✓ Interaction Specifications - 配置完成判定标准]
- [X] CHK078 "参与方不足"的具体数量标准是否定义？[✓ NFR-EC-004, NFR-EC-005]
- [X] CHK079 "参数配置正常"的判定标准是否定义？[✓ Interaction Specifications - 配置完成判定标准]

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Total Items | 79 | ✓ ALL PASS |
| Completed | 79 | 100% |
| Incomplete | 0 | - |
| Requirement Completeness | 24 | ✓ 24 done |
| Scenario Coverage | 13 | ✓ 13 done |
| UX/UI Requirements Quality | 13 | ✓ 13 done |
| API & Data Contracts | 9 | ✓ 9 done |
| Acceptance Criteria Quality | 2 | ✓ 2 done |
| Dependencies & Assumptions | 5 | ✓ 5 done |
| Ambiguities & Conflicts | 8 | ✓ 8 done |

---

## Review Instructions

1. **For each item**: Check if the corresponding requirement is present, clear, and testable
2. **Mark as complete**: When the requirement quality is satisfactory
3. **Create follow-up tasks**: For any [Gap] items that need spec clarification
4. **Note conflicts**: For any [Conflict] items that need resolution

**Reminder**: This checklist validates **requirement quality**, not implementation correctness.
