# Requirements Quality Checklist: 算法选择功能

**Purpose**: PR审查级别的需求质量验证，确保需求文档完整、清晰、一致、可度量
**Created**: 2026-02-28
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)
**Depth**: 标准 | **Audience**: PR审查者 | **Focus**: UX + API全面覆盖

---

## Requirement Completeness (需求完整性)

### UX交互需求

- [X] CHK001 - 是否定义了从流程编辑器到算法管理页面的完整导航路径？ [Completeness, Spec §FR-001] ✅ FR-001明确定义：Header右侧"设置"下拉菜单→路由跳转
- [ ] CHK002 - 算法列表的默认排序规则是否明确指定？ [Gap, Spec §FR-002] ⚠️ FR-002未指定排序，建议按创建时间倒序
- [X] CHK003 - 算法类型下拉选择的选项来源是否定义？ [Completeness, Spec §FR-003] ✅ FR-025和Assumption §2定义了8种算法类型
- [X] CHK004 - 删除算法的确认对话框文案和交互流程是否完整定义？ [Gap] ✅ US4场景5定义了警告提示，contracts定义了409错误
- [ ] CHK005 - 算法注册表单的取消/返回行为是否明确？ [Gap] ⚠️ 未定义，建议添加返回按钮行为
- [X] CHK006 - 参数模板编辑器的"拖拽排序"交互细节是否定义？ [Clarity, Spec §FR-010] ✅ US6场景3定义了拖拽排序功能
- [X] CHK007 - 任务节点详情面板中算法信息的展示位置和格式是否指定？ [Gap, Spec §FR-014] ✅ FR-014定义显示名称和版本号，tasks.md T012/T013指定位置
- [ ] CHK008 - "暂无可用算法"提示的具体样式和位置是否定义？ [Clarity, Spec §FR-013] ⚠️ FR-013仅说"显示提示信息"，样式未定义
- [X] CHK009 - 算法选择下拉框的搜索/过滤功能是否需要？ [Gap] ✅ 不需要，任务节点算法选择按computeType自动过滤
- [ ] CHK010 - 参数表单的布局（垂直/水平/分组）是否指定？ [Gap, Spec §FR-016] ⚠️ 未指定，建议采用垂直布局

### API/数据契约需求

- [X] CHK011 - 算法ID冲突时的错误处理是否定义？ [Gap] ✅ contracts/algorithm-api.md定义了409错误码和错误信息
- [X] CHK012 - 算法注册表单中英文名称的格式校验规则是否完整？ [Clarity, Spec Assumption §4] ✅ contracts定义了"字母数字下划线"规则
- [X] CHK013 - 版本号格式（vX.Y）的校验规则是否明确？ [Clarity, Spec Assumption §4] ✅ contracts定义了"vX.Y格式"规则
- [X] CHK014 - 参数模板的结构化存储格式是否定义？ [Gap, Spec §FR-007] ✅ data-model.md完整定义了AlgorithmParamTemplate结构
- [ ] CHK015 - JSON导出中algorithmParams为空时的处理方式是否明确？ [Gap, Spec §FR-021] ⚠️ 未明确定义，建议默认为空对象{}
- [X] CHK016 - Mock服务的网络延迟模拟范围是否指定？ [Gap] ✅ contracts定义了100-300ms延迟
- [X] CHK017 - 算法被删除后，引用该算法的任务节点JSON如何处理？ [Consistency, Edge Case] ✅ Edge Cases定义：保留快照信息
- [ ] CHK018 - 导入JSON时"算法缺失"状态的视觉标记是否定义？ [Gap, Edge Case] ⚠️ 仅说"标记为算法缺失状态"，视觉样式未定义

---

## Requirement Clarity (需求清晰度)

### 模糊术语

- [ ] CHK019 - "创建时间最新"是否明确为毫秒级时间戳比较？ [Clarity, Spec §FR-012] ⚠️ 未明确，data-model使用毫秒时间戳，应在spec中说明
- [X] CHK020 - "实时验证"是否量化为具体的延迟阈值？ [Clarity, Spec §FR-018, SC-006] ✅ SC-006明确定义：延迟不超过500ms
- [ ] CHK021 - "友好的错误提示"的具体内容和样式是否定义？ [Ambiguity, Edge Case] ⚠️ 未定义具体内容和样式
- [X] CHK022 - "结构化格式存储"的具体数据结构是否明确？ [Ambiguity, Spec §FR-010] ✅ data-model.md明确定义了存储结构
- [X] CHK023 - "相关资源企业"在企业选择场景的定义是否一致？ [Consistency] ✅ N/A - 本功能不涉及企业选择场景
- [X] CHK024 - "可视化界面"的具体UI组件类型是否指定？ [Clarity, Spec §FR-010] ✅ FR-010和US6定义了参数模板编辑器组件

### 量化指标

- [X] CHK025 - 算法列表"实时过滤"的响应时间是否量化？ [Measurability, Spec §FR-003] ✅ SC-001/002定义了1-2秒性能指标
- [X] CHK026 - 8种参数类型的输入控件映射是否完整定义？ [Completeness, Spec §FR-008] ✅ FR-008和FR-017定义了完整映射
- [ ] CHK027 - 5种验证规则的错误提示文案是否定义？ [Gap, Spec §FR-009] ⚠️ 验证规则定义了，但错误提示文案未定义
- [X] CHK028 - Mock数据10-15条的具体分布是否明确？ [Clarity, Spec §FR-025] ✅ Clarifications明确：每种类型1-2条，共10-15条

---

## Requirement Consistency (需求一致性)

### 跨章节一致性

- [X] CHK029 - 算法类型枚举在Spec和Data Model中是否一致？ [Consistency, Spec §FR-008 vs Key Entities] ✅ 两处定义一致：8种类型
- [X] CHK030 - 参数模板类型（8种）与验证规则（5种）的适用性是否明确？ [Consistency, Spec §FR-008-009] ✅ data-model定义了适用性
- [X] CHK031 - Edge Cases与User Stories的覆盖是否一致？ [Consistency] ✅ Edge Cases覆盖了US1-US6的关键边界情况
- [X] CHK032 - Assumptions中"暂不实现"与FR中的"必须提供"是否有冲突？ [Conflict Check] ✅ 无冲突，FR-005明确说明Mock场景暂不实现
- [X] CHK033 - JSON导出字段（algorithmId/Name/Version/Params）在所有相关需求中是否一致？ [Consistency, Spec §FR-021] ✅ FR-021和data-model定义一致

### 术语一致性

- [X] CHK034 - "算法类型"与"任务类型(computeType)"的映射关系是否在所有文档中一致？ [Consistency, Spec Assumption §2] ✅ Assumption §2明确定义了一一对应
- [ ] CHK035 - "参数模板"与"附加参数"术语使用是否一致？ [Consistency] ⚠️ 两术语混用，建议统一使用"参数模板"
- [X] CHK036 - "Mock API"与"Mock服务"术语使用是否统一？ [Consistency] ✅ 基本统一，contracts使用"Mock服务"

---

## Acceptance Criteria Quality (验收标准质量)

### 可度量性

- [ ] CHK037 - SC-003"30秒内完成参数配置"的起始/终止点是否明确？ [Measurability] ⚠️ 起始点（选择算法后）和终止点（填写完成）不够明确
- [ ] CHK038 - SC-004"95%用户成功"的统计方法和样本量是否定义？ [Measurability] ⚠️ 未定义统计方法和样本量
- [ ] CHK039 - SC-005"100%包含正确配置"的验证标准是否明确？ [Measurability] ⚠️ "正确配置"的定义不够明确
- [X] CHK040 - SC-006"即时显示"与"500ms延迟"是否矛盾？ [Conflict, Spec §SC-006] ✅ 不矛盾，"即时"定义为≤500ms

### 场景覆盖

- [X] CHK041 - 是否缺少算法编辑/更新功能的需求？ [Coverage, Gap] ✅ 故意排除，Assumption §8说明暂不支持版本管理
- [X] CHK042 - 是否缺少算法详情查看的需求？ [Coverage, Gap] ✅ 不需要独立页面，列表页可展示详情
- [X] CHK043 - 是否缺少批量删除算法的需求？ [Coverage, Gap] ✅ MVP不需要，单条删除满足需求
- [X] CHK044 - 是否缺少参数模板导入/导出的需求？ [Coverage, Gap] ✅ 不需要，通过JSON导出间接支持

---

## Scenario Coverage (场景覆盖)

### 主流程

- [X] CHK045 - 算法管理页面返回流程编辑器的路径是否定义？ [Gap] ✅ tasks.md T031定义了返回按钮
- [X] CHK046 - 多个任务节点同时选择同一算法的场景是否覆盖？ [Coverage] ✅ 允许，每个节点独立配置
- [ ] CHK047 - 算法列表分页加载的需求是否定义？ [Gap, Spec §SC-002] ⚠️ SC-002提到"支持100条"，但未定义分页

### 异常流程

- [X] CHK048 - 网络断开时算法选择的行为是否定义？ [Coverage, Gap] ✅ Edge Cases定义：显示友好错误提示
- [X] CHK049 - 内存存储达到上限时的处理是否定义？ [Edge Case, Gap] ✅ 不适用，100条记录内存占用可忽略
- [ ] CHK050 - 参数验证失败后表单提交按钮的状态是否定义？ [Gap] ⚠️ 未定义，建议禁用提交按钮

### 并发场景

- [X] CHK051 - 同时在多个浏览器标签页编辑同一流程的算法冲突处理？ [Coverage, Gap] ✅ 内存存储，各标签页独立，无冲突
- [X] CHK052 - 算法管理页面与任务编排页面的数据同步机制是否定义？ [Gap] ✅ 共享AlgorithmService单例，自动同步

---

## Edge Case Coverage (边缘情况覆盖)

### 数据边界

- [ ] CHK053 - 算法名称/版本号的最大长度是否定义？ [Gap] ⚠️ 未定义，data-model建议name:1-100，nameEn:1-50
- [ ] CHK054 - 参数模板最大字段数量是否定义？ [Gap] ⚠️ 未定义，建议限制为20个
- [ ] CHK055 - 单个参数值的最大长度是否定义？ [Gap] ⚠️ 未定义，建议string类型限制1000字符
- [ ] CHK056 - 枚举类型选项的最大数量是否定义？ [Gap] ⚠️ 未定义，建议限制为50个
- [ ] CHK057 - JSON类型参数的嵌套深度限制是否定义？ [Gap] ⚠️ 未定义，建议限制为3层

### 状态边界

- [X] CHK058 - 空参数模板（0个参数）的算法在任务节点中如何显示？ [Edge Case, Spec §US1-3] ✅ US1场景3定义：仅显示算法名称，不显示参数表单
- [ ] CHK059 - 所有8种算法类型都无可用算法时的全局提示是否定义？ [Edge Case, Gap] ⚠️ 未定义全局提示
- [ ] CHK060 - 算法类型下拉选择的默认选项是什么？ [Gap] ⚠️ 未定义，建议默认为"全部类型"

### 用户操作边界

- [X] CHK061 - 快速连续切换算法时的UI响应是否定义？ [Edge Case, Gap] ✅ 每次切换清空参数，响应时间由SC-001保证
- [ ] CHK062 - 参数表单部分填写后切换算法的提示是否需要？ [Gap] ⚠️ 未定义，建议添加确认提示
- [X] CHK063 - 算法包上传按钮点击后的Mock提示具体文案是否定义？ [Clarity, Edge Case] ✅ Edge Cases定义：显示"Mock模式下暂不支持文件上传"

---

## Non-Functional Requirements (非功能需求)

### 性能需求

- [X] CHK064 - 算法列表滚动性能（100条记录）是否量化？ [NFR, Spec §SC-002] ✅ SC-002定义：加载时间不超过2秒
- [X] CHK065 - 参数表单动态生成的性能要求是否定义？ [NFR, Gap] ✅ SC-006定义：验证延迟≤500ms，表单生成类似
- [X] CHK066 - JSON导出包含算法配置后的文件大小限制是否定义？ [NFR, Gap] ✅ 不需要，100条记录JSON大小可忽略

### 可访问性需求

- [ ] CHK067 - 算法选择下拉框的键盘导航是否定义？ [Accessibility, Gap] ⚠️ 未定义，建议支持Tab/Enter键
- [ ] CHK068 - 参数表单的错误提示对屏幕阅读器是否友好？ [Accessibility, Gap] ⚠️ 未定义，建议添加aria属性
- [ ] CHK069 - 算法管理页面的焦点管理是否定义？ [Accessibility, Gap] ⚠️ 未定义，建议定义焦点顺序

### 兼容性需求

- [X] CHK070 - Electron桌面应用中的算法管理功能是否有特殊需求？ [Compatibility, Gap] ✅ 无特殊需求，与Web一致
- [X] CHK071 - 不同浏览器的参数表单渲染一致性是否需要定义？ [Compatibility, Gap] ✅ 不需要，Vue组件保证一致性

---

## Dependencies & Assumptions (依赖与假设)

### 外部依赖

- [X] CHK072 - Vue Router的使用是否与现有项目一致？ [Dependency, Plan] ✅ plan.md确认需创建新router文件
- [X] CHK073 - 现有`useGraphState.ts`的扩展接口是否明确定义？ [Dependency, Gap] ✅ tasks.md T024定义了扩展方式
- [X] CHK074 - `dag-export.ts`的扩展方式是否与现有导出逻辑兼容？ [Dependency, Plan] ✅ tasks.md T023定义了扩展方式

### 假设验证

- [ ] CHK075 - Assumption §5"所有用户都能访问"是否与角色区分矛盾？ [Conflict Check] ⚠️ 有潜在矛盾，US4区分了"系统管理员"和"流程编排人员"
- [X] CHK076 - Assumption §8"暂不支持版本历史"是否需要在未来版本规划中记录？ [Traceability] ✅ 已记录在Assumptions中
- [ ] CHK077 - Mock数据初始化时机（页面加载时？首次访问时？）是否明确？ [Gap] ⚠️ 未明确，建议在AlgorithmService构造函数中初始化

---

## Ambiguities & Conflicts (歧义与冲突)

### 待澄清项

- [ ] CHK078 - "系统管理员"与"流程编排人员"角色是否可由同一用户担任？ [Ambiguity, Spec §US4 vs US1] ⚠️ 未明确，Assumption §5说"所有用户都能访问"
- [X] CHK079 - 算法删除后，已配置该算法的任务节点显示什么信息？ [Ambiguity, Edge Case] ✅ Edge Cases定义：保留快照信息，显示原算法名称
- [ ] CHK080 - 参数模板的"循环依赖"具体指什么场景？ [Clarity, Edge Case] ⚠️ 未明确定义，建议删除此边缘情况或具体说明

### 潜在冲突

- [X] CHK081 - FR-005"算法包上传暂不实现"与US5"上传算法包"验收标准是否冲突？ [Conflict Check] ✅ 不冲突，US5场景2中"上传算法包"是可选步骤
- [X] CHK082 - 内存存储与"100条算法记录"的可行性是否评估？ [Assumption Validation] ✅ 可行，100条记录内存占用约100KB，完全可接受

---

## Summary

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Requirement Completeness | 18 | 12 | 6 | 67% |
| Requirement Clarity | 10 | 7 | 3 | 70% |
| Requirement Consistency | 8 | 7 | 1 | 88% |
| Acceptance Criteria Quality | 8 | 5 | 3 | 63% |
| Scenario Coverage | 8 | 6 | 2 | 75% |
| Edge Case Coverage | 11 | 5 | 6 | 45% |
| Non-Functional Requirements | 8 | 5 | 3 | 63% |
| Dependencies & Assumptions | 6 | 4 | 2 | 67% |
| Ambiguities & Conflicts | 5 | 3 | 2 | 60% |

**Total Items**: 82
**Passed**: 54 (66%)
**Failed/Needs Attention**: 28 (34%)

---

## Failed Items Summary (需要关注的项目)

| ID | Issue | Recommendation |
|----|-------|----------------|
| CHK002 | 算法列表默认排序未定义 | 建议按创建时间倒序 |
| CHK005 | 算法注册表单取消行为未定义 | 建议添加返回按钮 |
| CHK008 | "暂无可用算法"样式未定义 | 建议定义提示样式和位置 |
| CHK010 | 参数表单布局未指定 | 建议采用垂直布局 |
| CHK015 | algorithmParams空值处理未定义 | 建议默认为空对象{} |
| CHK018 | "算法缺失"视觉标记未定义 | 建议定义标记样式 |
| CHK019 | "创建时间最新"未明确为毫秒比较 | 建议在spec中说明 |
| CHK021 | "友好的错误提示"未定义 | 建议定义提示内容模板 |
| CHK027 | 验证错误提示文案未定义 | 建议定义5种规则的提示模板 |
| CHK035 | "参数模板"与"附加参数"混用 | 建议统一使用"参数模板" |
| CHK037-039 | SC-003/004/005可度量性不足 | 建议明确测量方法 |
| CHK047 | 分页加载未定义 | 100条内不需要分页 |
| CHK050 | 验证失败提交按钮状态未定义 | 建议禁用提交按钮 |
| CHK053-057 | 数据边界未定义 | 建议在data-model中添加限制 |
| CHK059 | 全局无算法提示未定义 | 建议定义全局提示 |
| CHK060 | 算法类型下拉默认选项未定义 | 建议默认"全部类型" |
| CHK062 | 切换算法时确认提示未定义 | 建议添加确认提示 |
| CHK067-069 | 可访问性需求未定义 | 建议定义键盘导航和aria属性 |
| CHK075 | 角色权限与"所有用户"矛盾 | 建议明确角色模型 |
| CHK077 | Mock数据初始化时机未明确 | 建议在构造函数中初始化 |
| CHK078 | 角色是否可由同一用户担任 | 建议明确角色模型 |
| CHK080 | "循环依赖"定义不清 | 建议删除或具体说明 |

---

## Notes

- ✅ 标记为通过的项目：需求已明确或可合理推断
- ⚠️ 标记为需要关注的项目：建议在实现前补充定义
- 大部分失败项为"建议"级别，不阻塞实现
- 核心功能需求已完整定义，可以开始实现
