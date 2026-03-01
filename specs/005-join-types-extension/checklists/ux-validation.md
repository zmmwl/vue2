# Checklist: UX/交互需求与校验逻辑质量检查

**Purpose**: 验证 Join 类型扩展功能的 UX 交互需求和校验逻辑需求的完整性、清晰度和一致性
**Created**: 2026-03-01
**Feature**: [spec.md](../spec.md)
**Depth**: 标准级 - PR 审查
**Focus**: UX/交互需求, 校验逻辑需求
**Reviewed**: 2026-03-01
**Updated**: 2026-03-01 (补充规格说明后)

---

## UX 交互需求 - 完整性

- [x] CHK001 - 三种字段对齐模式（列对齐、逐字段映射、表格模式）的交互需求是否都已明确定义？ [Completeness, Spec §FR-002]
  > ✅ 三种模式在 FR-002 中已列出，交互方式已说明，默认模式已明确

- [x] CHK002 - 模式切换时的数据保留/清除策略是否已明确说明？ [Completeness, Spec §FR-002]
  > ✅ 澄清记录中已明确

- [x] CHK003 - 实时预览的更新时机和内容是否已明确指定？ [Completeness, Spec §FR-002]
  > ✅ 已补充：每次字段映射变更后 200ms 内更新

- [x] CHK004 - join 类型选择器的 UI 位置和交互方式是否已明确？ [Completeness, Spec §FR-007]
  > ✅ FR-007 明确在 InputProviderConfig.vue 中

- [x] CHK005 - join 字段复选框的禁用状态视觉表现是否已定义？ [Gap → Resolved]
  > ✅ 已补充：opacity: 0.5, cursor: not-allowed

- [x] CHK006 - 统一别名的输入方式和校验规则是否已明确？ [Completeness, Spec §FR-002]
  > ✅ 已补充：长度 1-64 字符，支持中文、英文、数字和下划线

## UX 交互需求 - 清晰度

- [x] CHK007 - "直观的字段对齐界面"是否有可测量的定义？ [Clarity, Spec §US1]
  > ✅ 已关联到 SC-006 的"98%操作成功率"

- [x] CHK008 - "实时预览"的具体延迟要求是否已量化？ [Clarity, Spec §FR-002]
  > ✅ 已量化：200ms 内更新

- [x] CHK009 - 错误提示"清晰"的标准是否已定义（内容、位置、持续时间）？ [Clarity, Spec §FR-006]
  > ✅ FR-006 已定义：红色内联警告条 + 禁用保存按钮 + 具体冲突信息

- [x] CHK010 - "引导用户重新配置"的具体交互方式是否已明确？ [Clarity, Edge Cases]
  > ✅ 已补充：内联提示（非模态），高亮显示相关区域

- [ ] CHK011 - "拖拽调整字段顺序"的拖放目标区域是否已明确定义？ [Clarity, Spec §FR-002]
  > ⚠️ 仍需在实现中确定具体拖放区域

## UX 交互需求 - 一致性

- [x] CHK012 - 四种 join 类型在 UI 上的视觉区分是否一致？ [Consistency, Spec §FR-007]
  > ✅ FR-010 要求在 FlowDetailPanel 中正确显示所有类型标签

- [x] CHK013 - NoAssoc 和 CROSS 的 join 字段禁用行为是否一致定义？ [Consistency, Spec §FR-003 vs §FR-004]
  > ✅ FR-003 和 FR-004 定义一致

- [x] CHK014 - 错误提示的样式和行为在不同冲突场景下是否一致？ [Consistency, Spec §FR-006]
  > ✅ 统一为内联警告条 + 禁用保存按钮

- [x] CHK015 - 类型切换时的配置清除逻辑在所有场景下是否一致？ [Consistency, Edge Cases]
  > ✅ 已统一：自动清除不适用的配置 + 提示

## 校验逻辑需求 - 完整性

- [x] CHK016 - 类型共存规则的所有组合情况是否都已覆盖？ [Completeness, Spec §FR-005]
  > ✅ FR-005 已覆盖

- [x] CHK017 - Union 与 INNER 不能共存的规则是否覆盖双向场景？ [Completeness, Spec §US4]
  > ✅ US4 场景 1 和 2 已覆盖

- [x] CHK018 - CROSS 数量限制（仅允许一个）的校验时机是否已明确？ [Completeness, Spec §FR-005]
  > ✅ 已补充：类型选择变更时实时校验

- [x] CHK019 - NoAssoc 与所有类型共存的规则是否已完整列出？ [Completeness, Spec §FR-005]
  > ✅ FR-005 已明确

- [x] CHK020 - 校验失败的阻止方式（阻止操作 vs 禁用保存）是否已明确？ [Completeness, Spec §FR-006]
  > ✅ 已统一：内联警告 + 禁用保存按钮

## 校验逻辑需求 - 清晰度

- [x] CHK021 - "阻止操作"的具体行为是否已明确？ [Clarity, Spec §US4]
  > ✅ 已统一为内联警告 + 禁用保存按钮

- [x] CHK022 - 校验的触发时机是否已明确？ [Clarity]
  > ✅ 已补充：类型选择变更时实时校验

- [x] CHK023 - 错误提示文本的具体措辞是否已在需求中指定？ [Clarity, Spec §US4]
  > ✅ US4 已指定具体提示文本

- [x] CHK024 - 保存按钮禁用的条件是否已明确？ [Clarity, Spec §FR-006]
  > ✅ 存在冲突时禁用

## 校验逻辑需求 - 一致性

- [x] CHK025 - 类型共存规则的描述在 FR-005 和 US4 中是否一致？ [Consistency]
  > ✅ 描述一致

- [x] CHK026 - CROSS 限制的描述在 US3 和 US4 中是否一致？ [Consistency]
  > ✅ 已统一为"内联警告 + 禁用保存按钮"

- [x] CHK027 - 错误提示格式的描述在 FR-006 和澄清记录中是否一致？ [Consistency]
  > ✅ 一致

## 边界情况覆盖

- [x] CHK028 - Union 模式下删除数据源时的字段映射处理需求是否完整？ [Coverage, Edge Cases]
  > ✅ 已明确

- [x] CHK029 - Union 模式下字段数量不一致时的空值填充需求是否明确？ [Coverage, Edge Cases]
  > ✅ 已明确

- [x] CHK030 - 从 CROSS/NoAssoc 切换到 INNER 时引导配置 join 字段的需求是否完整？ [Coverage, Edge Cases]
  > ✅ 已补充：内联提示 + 高亮显示

- [x] CHK031 - 所有数据源都是 NoAssoc 时的任务执行需求是否明确？ [Coverage, Edge Cases]
  > ✅ 已明确

- [x] CHK032 - 混合 NoAssoc 和其他类型时的独立处理需求是否完整？ [Coverage, Edge Cases]
  > ✅ 已明确

## 可测量性

- [x] CHK033 - "配置步骤减少 50%"的计算基准是否已明确？ [Measurability, Spec §SC-003]
  > ✅ 已补充：INNER 需要 5 步，NoAssoc/CROSS 需要 2-3 步

- [x] CHK034 - "操作成功率达到 98%"的测量方法是否已定义？ [Measurability, Spec §SC-006]
  > ✅ 已补充：首次尝试即能正确完成字段映射并保存的比例

- [x] CHK035 - 错误提示的"清晰"是否可客观验证？ [Measurability, Spec §FR-006]
  > ✅ 已关联到用户测试

## 依赖与假设

- [x] CHK036 - "用户已了解 SQL UNION 操作"的假设是否合理？ [Assumption, Spec §Assumptions]
  > ✅ 假设合理，目标用户是数据工程师

- [ ] CHK037 - "字段类型兼容性在后续版本实现"的限制是否在 UI 中有相应提示？ [Assumption, Spec §Assumptions]
  > ⚠️ 建议在实现中考虑添加提示（低优先级）

- [x] CHK038 - "Union 数据去重由后端处理"是否影响前端 UI？ [Dependency, Spec §Assumptions]
  > ✅ 不影响前端 UI

## 待澄清项

- [x] CHK039 - 是否需要为三种字段对齐模式提供默认推荐？ [Gap → Resolved]
  > ✅ 已明确：默认使用表格模式

- [x] CHK040 - join 类型是否可以在保存后再次修改？ [Gap → Resolved]
  > ✅ 支持修改，类型切换逻辑已定义

- [x] CHK041 - 多个输入源同时配置时的 UI 布局是否已定义？ [Gap → Resolved]
  > ✅ 已补充：独立卡片，支持折叠/展开

---

## 检查摘要

| 分类 | 通过 | 需补充 |
|------|------|--------|
| UX 交互需求 - 完整性 | 6 | 0 |
| UX 交互需求 - 清晰度 | 4 | 1 |
| UX 交互需求 - 一致性 | 4 | 0 |
| 校验逻辑需求 - 完整性 | 5 | 0 |
| 校验逻辑需求 - 清晰度 | 4 | 0 |
| 校验逻辑需求 - 一致性 | 3 | 0 |
| 边界情况覆盖 | 5 | 0 |
| 可测量性 | 3 | 0 |
| 依赖与假设 | 2 | 1 |
| 待澄清项 | 3 | 0 |
| **总计** | **39** | **2** |

**通过率**: 95%

---

## 剩余待补充项（低优先级，可在实现中确定）

1. **CHK011**: 拖放目标区域 - 可在 UI 实现中确定
2. **CHK037**: 字段类型兼容性提示 - 后续版本考虑

---

## 规格说明更新摘要

| 更新项 | 位置 | 变更内容 |
|--------|------|----------|
| FR-002 | 功能需求 | 补充实时预览延迟(200ms)、别名校验规则、默认模式 |
| FR-003/FR-004 | 功能需求 | 补充禁用视觉表现 |
| FR-005 | 功能需求 | 补充校验时机 |
| US3/US4 | 用户故事 | 统一为"内联警告 + 禁用保存按钮" |
| SC-001~SC-006 | 成功标准 | 补充测量方法 |
| 澄清记录 | Clarifications | 新增 5 条澄清 |
| 边界情况 | Edge Cases | 补充引导交互、UI 布局 |
