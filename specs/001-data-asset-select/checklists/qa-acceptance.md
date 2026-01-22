# Checklist: QA 验收基准 - 数据资产选择与展示

**Purpose**: QA 团队需求质量验收基准检查清单
**Created**: 2026-01-22
**Feature**: 001-data-asset-select
**Focus Areas**: UX/交互体验 + API/数据契约 + 功能覆盖完整性 + 测试可验收性
**Actor**: QA 团队
**Timing**: 实施前需求验证

---

## Requirement Completeness

- [x] CHK001 - 所有 P1 优先级用户故事（US1、US2、US4）是否有完整的验收场景覆盖？[已覆盖, Spec §User Scenarios]
- [x] CHK002 - 拖放节点后的自动弹窗需求是否包含触发条件、弹窗时机、节点状态处理？[已定义, Spec §FR-001, §Edge Cases]
- [x] CHK003 - 多步骤向导（企业 → 资产 → 字段）是否明确定义每个步骤的进入/退出条件？[已定义, Spec §FR-002, §FR-002-1/2/3, §Edge Cases]
- [x] CHK004 - 对话框取消/关闭时节点删除逻辑是否有明确的行为定义？[已定义, Spec §FR-020, §Edge Cases]
- [x] CHK005 - 详情面板空状态（未配置节点）的需求是否完整定义？[已定义, Spec §US2-4, §FR-029, §NFR-006]
- [x] CHK006 - 导出 JSON 时未配置节点的处理需求是否明确？[已定义, Spec §US4-3, §Edge Cases]
- [x] CHK007 - API 错误分类策略（网络/超时 vs 认证/权限/业务错误）是否完整覆盖所有错误场景？[已定义, Spec §FR-017, §Edge Cases]
- [x] CHK008 - 缓存重建逻辑（从 JSON 加载）是否包含完整的重建规则和边界条件？[已定义, Spec §FR-015-1, §Key Entities]
- [x] CHK009 - 编辑配置模式的取消行为是否明确定义保持原有配置不变？[已定义, Spec §US3-3, §Edge Cases]
- [x] CHK010 - Playwright 无头模式下多 worker 并发测试的需求是否明确？[已定义, Spec §NFR-014, §NFR-015]

## Requirement Clarity

- [x] CHK011 - "30 秒内完成单个数据源节点配置"是否定义了网络条件假设？[已定义, Spec §SC-001: "API 响应 < 1 秒，宽带连接"]
- [x] CHK012 - "搜索功能在 1 秒内返回过滤结果（>20 项时）"是否明确测试数据规模？[已定义, Spec §SC-005, §NFR-004]
- [x] CHK013 - "虚拟滚动确保性能"是否量化性能指标（如滚动帧率 > 30fps）？[已定义, Spec §SC-009, §NFR-002]
- [x] CHK014 - "已配置节点在标题旁显示已选资产名称"是否定义了显示位置和样式规范？[已定义, Spec §FR-016, §NFR-007]
- [x] CHK015 - "未配置节点显示'未配置'标签"是否定义视觉标识规范？[已定义, Spec §FR-016, §NFR-008]
- [x] CHK016 - "智能错误分类"是否明确定义各类错误的识别规则和用户提示文案？[已定义, Spec §FR-017, §Edge Cases]
- [x] CHK017 - "自动重试 2-3 次"是否明确重试间隔和最终失败处理？[已定义, Spec §Clarifications, §Edge Cases, §research.md]
- [x] CHK018 - "内存缓存（Map 缓存）"是否定义缓存键策略和生命周期？[已定义, Spec §Key Entities, §data-model.md]
- [x] CHK019 - API 接口参数格式（POST 请求）是否明确定义请求体结构？[已定义, Spec §Assumptions #2, §contracts/api-contract.md]
- [x] CHK020 - 详情面板字段列表展示是否定义字段顺序和排序规则？[已定义, Spec §FR-027: "按字段原始顺序显示"]

## Requirement Consistency

- [x] CHK021 - 企业列表获取方式（GetEnterpriseList 返回 enterpriseAssetList vs GetAssetList 过滤）是否一致？[已明确, Spec §FR-005: 两种方式均可]
- [x] CHK022 - 节点删除逻辑：对话框取消时立即删除 vs 导出时允许未配置节点是否存在矛盾？[无矛盾, Spec §FR-020, §Edge Cases: 新建时删除，导出时警告]
- [x] CHK023 - API 错误处理策略在 Clarifications 和 FR-017 中是否一致？[已一致, Spec §Clarifications, §FR-017, §Edge Cases]
- [x] CHK024 - 字段类型定义（SelectedField vs SaveTableColumnItem）在 spec 和 data-model 中是否一致？[已一致, Spec §Key Entities, §data-model.md]
- [x] CHK025 - 缓存重建需求在 FR-015-1 和 Key Entities 中描述是否一致？[已一致, Spec §FR-015-1, §Key Entities]
- [x] CHK026 - 虚拟滚动性能要求在 SC-009 和 tasks.md 中是否一致？[已一致, Spec §SC-009]
- [x] CHK027 - 浏览器兼容性要求在 Clarifications 和 Assumptions 中是否一致？[已一致, Spec §Clarifications, §Assumptions #6]
- [x] CHK028 - "至少选择一个字段"验证在向导步骤中是否与导航禁用逻辑一致？[已一致, Spec §FR-019, §FR-002-2, §Edge Cases]

## Acceptance Criteria Quality

- [x] CHK029 - "90% 用户首次使用成功完成配置"是否定义了成功标准和测量方法？[已定义, Spec §SC-003: "完成三步骤选择并保存配置"]
- [x] CHK030 - "用户识别准确率达到 100%（节点配置状态）"是否可客观验证？[可验证, Spec §SC-007, §NFR-007/008: 明确视觉规范]
- [x] CHK031 - "导出 JSON 包含 100% 完整数据资产信息"是否定义完整性的验证标准？[已定义, Spec §SC-004: 详细验证标准]
- [x] CHK032 - "重新配置平均时间少于 15 秒"是否定义测量场景和样本量？[已定义, Spec §SC-006: "从点击重新配置到保存新配置"]
- [x] CHK033 - E2E 测试用例是否覆盖所有用户故事的独立测试标准？[已覆盖, Spec §User Scenarios: Independent Test]
- [x] CHK034 - 每个验收场景是否包含 Given-When-Then 三要素且可执行？[已包含, Spec §User Scenarios]
- [x] CHK035 - 性能测试是否定义基准环境和测试数据集？[已定义, Spec §NFR-001 至 §NFR-005]
- [x] CHK036 - 导出 JSON 验收标准是否定义可被系统正确加载和恢复的验证步骤？[已定义, Spec §SC-004, §FR-015]

## Scenario Coverage

- [x] CHK037 - 是否定义了用户在向导任意步骤点击取消的行为？[已定义, Spec §Edge Cases: 对话框交互]
- [x] CHK038 - 是否定义了用户在选择过程中修改浏览器标签页或刷新页面的处理？[已定义, Spec §Edge Cases: 并发和状态]
- [x] CHK039 - 是否定义了同一资产被多个节点选择时的缓存行为？[已定义, Spec §Edge Cases, §Key Entities]
- [x] CHK040 - 是否定义了 API 返回部分数据（如企业列表为空、字段列表为空）的场景？[已定义, Spec §Edge Cases: 空数据处理]
- [x] CHK041 - 是否定义了拖放节点到画布边缘或无效位置的处理？[已定义, Spec §Edge Cases: UI 交互]
- [x] CHK042 - 是否定义了用户快速连续拖放多个节点时的并发行为？[已定义, Spec §Edge Cases: 并发和状态]
- [x] CHK043 - 是否定义了详情面板在节点未选中时的显示状态？[已定义, Spec §FR-029, §NFR-006]
- [x] CHK044 - 是否定义了编辑配置过程中 API 调用失败时的回退逻辑？[已定义, Spec §US3-3: 保持原有配置]
- [x] CHK045 - 是否定义了加载 JSON 时节点数据损坏或缺失的处理？[已定义, Spec §FR-030, §Edge Cases: 导出和导入]
- [x] CHK046 - 是否定义了搜索无结果时的用户提示？[已定义, Spec §Edge Cases: 搜索和过滤]

## Edge Case Coverage

- [x] CHK047 - 企业列表接口返回空列表时的提示需求是否完整？[已定义, Spec §Edge Cases: 空数据处理]
- [x] CHK048 - 所选企业下无数据资产时的提示需求是否完整？[已定义, Spec §Edge Cases: 空数据处理]
- [x] CHK049 - 数据资产字段列表为空时的提示需求是否完整？[已定义, Spec §Edge Cases: 空数据处理]
- [x] CHK050 - 用户未选择任何字段点击确认时的验证需求是否完整？[已定义, Spec §Edge Cases: 验证和错误处理]
- [x] CHK051 - 导出时部分节点未配置的警告需求是否完整？[已定义, Spec §Edge Cases: 导出和导入]
- [x] CHK052 - 网络请求超时 10 秒后的重试逻辑是否定义最大重试次数上限？[已定义, Spec §Clarifications: 2-3 次]
- [x] CHK053 - API 返回 500 或其他未分类错误时的处理需求是否定义？[已定义, Spec §Edge Cases: 验证和错误处理]
- [x] CHK054 - 虚拟滚动列表在快速滚动时的渲染需求是否定义？[已定义, Spec §SC-009, §NFR-002]
- [x] CHK055 - 用户在字段搜索框输入特殊字符或超长字符串的处理是否定义？[已定义, Spec §Edge Cases: 搜索和过滤]
- [x] CHK056 - 浏览器向后/前进导航按钮在对话框打开时的行为是否定义？[Out of Scope, 浏览器原生行为]

## Non-Functional Requirements

- [x] CHK057 - API 响应时间要求（< 1 秒良好网络条件）是否定义测试方法？[已定义, Spec §NFR-001]
- [x] CHK058 - 虚拟滚动处理 500 个字段的内存占用要求是否定义？[已定义, Spec §SC-010, §NFR-003]
- [x] CHK059 - API 请求超时阈值 10 秒是否定义配置方式？[已定义, Spec §SC-008, §contracts/api-contract.md]
- [x] CHK060 - 日志记录的级别控制（error/warn/info）是否定义输出目标？[已定义, Spec §FR-025/026, §Assumptions #15]
- [x] CHK061 - 浏览器兼容性（Chrome >= 90 等）是否定义测试矩阵？[已定义, Spec §Assumptions #6, §NFR-011]
- [x] CHK062 - 多 worker 并发测试的并发数量是否定义？[已定义, Spec §NFR-015]
- [x] CHK063 - 无头模式测试的配置要求是否明确？[已定义, Spec §NFR-014]
- [x] CHK064 - 拖拽功能的跨浏览器兼容性是否定义测试要求？[已定义, Spec §NFR-012]
- [x] CHK065 - 连线校验功能的错误提示需求是否定义？[Out of Scope: 此功能不属于本 feature]
- [x] CHK066 - 系统在低带宽或高延迟网络下的降级需求是否定义？[已定义, Spec §Edge Cases: 重试策略和超时处理]

## Dependencies & Assumptions

- [x] CHK067 - 企业列表接口、资产详情接口的可用性假设是否已验证？[已定义, Spec §Assumptions #1-4, §Dependencies]
- [x] CHK068 - 用户已通过身份认证的假设是否与实际认证流程一致？[已定义, Spec §Assumptions #5]
- [x] CHK069 - 字段信息静态假设（配置过程中不变）是否考虑并发修改场景？[已定义, Spec §Assumptions #9]
- [x] CHK070 - Vue Flow 库的拖放事件处理是否与现有项目兼容？[已定义, Spec §Assumptions #16, §Dependencies]
- [x] CHK071 - 右侧详情面板组件的扩展性需求是否定义？[已定义, Spec §Assumptions #17, §Dependencies]
- [x] CHK072 - Mock 数据与真实 API 响应格式的一致性是否验证？[已定义, Spec §Assumptions #4, §NFR-016, §contracts/api-contract.md]
- [x] CHK073 - 用户具有基本数据素养的假设是否影响 UI 设计需求？[已定义, Spec §Assumptions #7, §NFR-006/010]
- [x] CHK074 - 单个资产最多 500 字段的假设是否与真实数据一致？[已定义, Spec §Assumptions #12, §Assumptions #20]

## Ambiguities & Conflicts

- [x] CHK075 - "多步骤向导模式"是否允许跳过已完成的步骤直接返回？[已明确, Spec §FR-002-3: "允许通过上一步按钮返回修改"]
- [x] CHK076 - "上一步/下一步导航"是否支持键盘快捷键？[已定义, Spec §FR-028, §NFR-009: 支持 ESC、Enter、方向键]
- [x] CHK077 - "立即删除节点"是否需要确认对话框还是直接删除？[已明确, Spec §Clarifications, §FR-020: 立即删除，无确认]
- [x] CHK078 - "完整数据资产信息"是否包含所有字段还是仅已选字段？[已明确, Spec §FR-021, §Key Entities: 包含完整 dataInfo（所有字段）]
- [x] CHK079 - "资产名称"的显示格式（完整名称 vs 截断 vs Tooltip）是否定义？[已定义, Spec §NFR-007: 标题右侧显示，可使用 Tooltip 处理长名称]
- [x] CHK080 - "日志记录关键操作"是否定义审计日志留存要求？[已定义, Spec §FR-025/026: 使用 console API，生产环境可配置]
- [x] CHK081 - "多个 worker"并发测试是否定义测试数据隔离策略？[已定义, Spec §NFR-015: 测试数据之间相互隔离]
- [x] CHK082 - "连线校验功能"的具体校验规则是否在 spec 中定义？[Out of Scope: 此功能不属于本 feature]

## Testability & Automation Coverage

- [x] CHK083 - 所有用户故事是否都有对应的 E2E 测试用例？[已覆盖, Spec §User Scenarios: Independent Test, §tasks.md]
- [x] CHK084 - 拖放功能的自动化测试是否定义无头模式下的可靠性保障？[已定义, Spec §NFR-014]
- [x] CHK085 - 连线校验功能的测试覆盖是否包含所有校验场景？[Out of Scope: 此功能不属于本 feature]
- [x] CHK086 - Mock 数据是否覆盖所有 API 响应场景（成功、失败、空、部分数据）？[已定义, Spec §NFR-016, §contracts/api-contract.md]
- [x] CHK087 - 性能测试是否定义可重复执行的基准？[已定义, Spec §NFR-001 至 §NFR-005]
- [x] CHK088 - 多 worker 并发测试是否定义执行顺序和依赖关系？[已定义, Spec §NFR-015]
- [x] CHK089 - 虚拟滚动性能测试是否定义测量工具和指标？[已定义, Spec §NFR-002, §SC-009]
- [x] CHK090 - 搜索性能测试是否定义不同数据规模下的基准？[已定义, Spec §NFR-004]

## Traceability

- [x] CHK091 - 每个 FR 是否有对应的用户故事引用？[已追溯, Spec §Functional Requirements → §User Scenarios]
- [x] CHK092 - 每个 SC 是否可追溯到具体的用户故事或 FR？[已追溯, Spec §Success Criteria → §User Scenarios / §Functional Requirements]
- [x] CHK093 - Edge Cases 是否追溯到对应的用户故事场景？[已追溯, Spec §Edge Cases 按类别组织，可追溯到相关 US]
- [x] CHK094 - 任务（T001-T054）是否追溯到用户故事或阶段？[已追溯, §tasks.md: 按 Phase 和 Story 组织]
- [x] CHK095 - E2E 测试用例是否追溯到验收场景？[已追溯, §tasks.md: Tests for User Stories → §User Scenarios]
- [x] CHK096 - Clarifications 中的决策是否更新到 spec.md 的对应章节？[已更新, Spec §Clarifications 已整合到各章节]

---

## Summary

- **Total Items**: 96
- **Completed**: 96
- **Focus Areas**: UX/交互体验、API/数据契约、功能覆盖完整性、测试可验收性
- **Actor**: QA 团队
- **Timing**: 实施前需求验证
- **User-Specified Items**: Playwright 无头模式、多 worker 并发、UI 拖拽、连线校验 (Out of Scope)

**Status**: ✅ **ALL CHECKS PASSED** - 所有 QA 验收基准检查已完成

**Note**:
- CHK065（连线校验功能）和 CHK082、CHK085 标记为 Out of Scope，因为连线校验功能不属于本数据资产选择与展示功能
- CHK056（浏览器向后/前进导航）标记为 Out of Scope，因为这是浏览器原生行为，不在功能控制范围内
- 其余 93 个检查项均已通过或在规格文档中有明确定义
