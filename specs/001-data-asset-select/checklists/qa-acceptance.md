# Checklist: QA 验收基准 - 数据资产选择与展示

**Purpose**: QA 团队需求质量验收基准检查清单
**Created**: 2026-01-22
**Feature**: 001-data-asset-select
**Focus Areas**: UX/交互体验 + API/数据契约 + 功能覆盖完整性 + 测试可验收性
**Actor**: QA 团队
**Timing**: 实施前需求验证

---

## Requirement Completeness

- [ ] CHK001 - 所有 P1 优先级用户故事（US1、US2、US4）是否有完整的验收场景覆盖？[Gap, User Stories §US1-US4]
- [ ] CHK002 - 拖放节点后的自动弹窗需求是否包含触发条件、弹窗时机、节点状态处理？[Completeness, Spec §FR-001]
- [ ] CHK003 - 多步骤向导（企业 → 资产 → 字段）是否明确定义每个步骤的进入/退出条件？[Completeness, Spec §FR-002]
- [ ] CHK004 - 对话框取消/关闭时节点删除逻辑是否有明确的行为定义？[Completeness, Spec §FR-020]
- [ ] CHK005 - 详情面板空状态（未配置节点）的需求是否完整定义？[Completeness, Spec §US2-4]
- [ ] CHK006 - 导出 JSON 时未配置节点的处理需求是否明确？[Completeness, Spec §US4-3]
- [ ] CHK007 - API 错误分类策略（网络/超时 vs 认证/权限/业务错误）是否完整覆盖所有错误场景？[Completeness, Spec §FR-017]
- [ ] CHK008 - 缓存重建逻辑（从 JSON 加载）是否包含完整的重建规则和边界条件？[Completeness, Spec §FR-015-1]
- [ ] CHK009 - 编辑配置模式的取消行为是否明确定义保持原有配置不变？[Completeness, Spec §US3-3]
- [ ] CHK010 - Playwright 无头模式下多 worker 并发测试的需求是否明确？[Gap, Testing Infrastructure]

## Requirement Clarity

- [ ] CHK011 - "30 秒内完成单个数据源节点配置"是否定义了网络条件假设？[Clarity, Spec §SC-001]
- [ ] CHK012 - "搜索功能在 1 秒内返回过滤结果（>20 项时）"是否明确测试数据规模？[Clarity, Spec §SC-005]
- [ ] CHK013 - "虚拟滚动确保性能"是否量化性能指标（如滚动帧率 > 30fps）？[Clarity, Tasks §T017]
- [ ] CHK014 - "已配置节点在标题旁显示已选资产名称"是否定义了显示位置和样式规范？[Clarity, Spec §FR-016]
- [ ] CHK015 - "未配置节点显示'未配置'标签"是否定义视觉标识规范？[Clarity, Spec §FR-016]
- [ ] CHK016 - "智能错误分类"是否明确定义各类错误的识别规则和用户提示文案？[Clarity, Spec §FR-017]
- [ ] CHK017 - "自动重试 2-3 次"是否明确重试间隔和最终失败处理？[Clarity, Spec §Edge Cases]
- [ ] CHK018 - "内存缓存（Map 缓存）"是否定义缓存键策略和生命周期？[Clarity, Spec §Key Entities]
- [ ] CHK019 - API 接口参数格式（POST 请求）是否明确定义请求体结构？[Clarity, Spec §Dependencies]
- [ ] CHK020 - 详情面板字段列表展示是否定义字段顺序和排序规则？[Clarity, Spec §FR-012]

## Requirement Consistency

- [ ] CHK021 - 企业列表获取方式（GetEnterpriseList 返回 enterpriseAssetList vs GetAssetList 过滤）是否一致？[Consistency, Spec §FR-005]
- [ ] CHK022 - 节点删除逻辑：对话框取消时立即删除 vs 导出时允许未配置节点是否存在矛盾？[Conflict, Spec §FR-020 vs §US4-3]
- [ ] CHK023 - API 错误处理策略在 Clarifications 和 FR-017 中是否一致？[Consistency, Spec §Clarifications vs §FR-017]
- [ ] CHK024 - 字段类型定义（SelectedField vs SaveTableColumnItem）在 spec 和 data-model 中是否一致？[Consistency, Spec §Key Entities]
- [ ] CHK025 - 缓存重建需求在 FR-015-1 和 Key Entities 中描述是否一致？[Consistency, Spec §FR-015-1 vs §Key Entities]
- [ ] CHK026 - 虚拟滚动性能要求在 SC-005 和 T017 中是否一致？[Consistency, Spec §SC-005 vs Tasks §T017]
- [ ] CHK027 - 浏览器兼容性要求在 Clarifications 和 Assumptions 中是否一致？[Consistency, Spec §Clarifications vs §Assumptions]
- [ ] CHK028 - "至少选择一个字段"验证在向导步骤中是否与导航禁用逻辑一致？[Consistency, Spec §FR-019 vs §FR-002-2]

## Acceptance Criteria Quality

- [ ] CHK029 - "90% 用户首次使用成功完成配置"是否定义了成功标准和测量方法？[Measurability, Spec §SC-003]
- [ ] CHK030 - "用户识别准确率达到 100%（节点配置状态）"是否可客观验证？[Measurability, Spec §SC-007]
- [ ] CHK031 - "导出 JSON 包含 100% 完整数据资产信息"是否定义完整性的验证标准？[Measurability, Spec §SC-004]
- [ ] CHK032 - "重新配置平均时间少于 15 秒"是否定义测量场景和样本量？[Measurability, Spec §SC-006]
- [ ] CHK033 - E2E 测试用例是否覆盖所有用户故事的独立测试标准？[Coverage, Tasks §Independent Test Criteria]
- [ ] CHK034 - 每个验收场景是否包含 Given-When-Then 三要素且可执行？[Testability, Spec §User Scenarios]
- [ ] CHK035 - 性能测试（T052、T053）是否定义基准环境和测试数据集？[Gap, Tasks §T052/T053]
- [ ] CHK036 - 导出 JSON 验收标准是否定义可被系统正确加载和恢复的验证步骤？[Testability, Spec §US4-2]

## Scenario Coverage

- [ ] CHK037 - 是否定义了用户在向导任意步骤点击取消的行为？[Coverage, Gap]
- [ ] CHK038 - 是否定义了用户在选择过程中修改浏览器标签页或刷新页面的处理？[Coverage, Gap]
- [ ] CHK039 - 是否定义了同一资产被多个节点选择时的缓存行为？[Coverage, Spec §Key Entities]
- [ ] CHK040 - 是否定义了 API 返回部分数据（如企业列表为空、字段列表为空）的场景？[Coverage, Spec §Edge Cases]
- [ ] CHK041 - 是否定义了拖放节点到画布边缘或无效位置的处理？[Coverage, Gap]
- [ ] CHK042 - 是否定义了用户快速连续拖放多个节点时的并发行为？[Coverage, Gap]
- [ ] CHK043 - 是否定义了详情面板在节点未选中时的显示状态？[Coverage, Gap]
- [ ] CHK044 - 是否定义了编辑配置过程中 API 调用失败时的回退逻辑？[Coverage, Gap]
- [ ] CHK045 - 是否定义了加载 JSON 时节点数据损坏或缺失的处理？[Coverage, Gap]
- [ ] CHK046 - 是否定义了搜索无结果时的用户提示？[Coverage, Spec §US5]

## Edge Case Coverage

- [ ] CHK047 - 企业列表接口返回空列表时的提示需求是否完整？[Edge Case, Spec §Edge Cases]
- [ ] CHK048 - 所选企业下无数据资产时的提示需求是否完整？[Edge Case, Spec §Edge Cases]
- [ ] CHK049 - 数据资产字段列表为空时的提示需求是否完整？[Edge Case, Spec §Edge Cases]
- [ ] CHK050 - 用户未选择任何字段点击确认时的验证需求是否完整？[Edge Case, Spec §Edge Cases]
- [ ] CHK051 - 导出时部分节点未配置的警告需求是否完整？[Edge Case, Spec §Edge Cases]
- [ ] CHK052 - 网络请求超时 10 秒后的重试逻辑是否定义最大重试次数上限？[Edge Case, Spec §Edge Cases]
- [ ] CHK053 - API 返回 500 或其他未分类错误时的处理需求是否定义？[Edge Case, Gap]
- [ ] CHK054 - 虚拟滚动列表在快速滚动时的渲染需求是否定义？[Edge Case, Gap]
- [ ] CHK055 - 用户在字段搜索框输入特殊字符或超长字符串的处理是否定义？[Edge Case, Gap]
- [ ] CHK056 - 浏览器向后/前进导航按钮在对话框打开时的行为是否定义？[Edge Case, Gap]

## Non-Functional Requirements

- [ ] CHK057 - API 响应时间要求（< 1 秒良好网络条件）是否定义测试方法？[NFR, Spec §SC-001]
- [ ] CHK058 - 虚拟滚动处理 500 个字段的内存占用要求是否定义？[NFR, Spec §Assumptions #9]
- [ ] CHK059 - API 请求超时阈值 10 秒是否定义配置方式？[NFR, Spec §SC-008]
- [ ] CHK060 - 日志记录的级别控制（error/warn/info）是否定义输出目标？[NFR, Spec §FR-025/FR-026]
- [ ] CHK061 - 浏览器兼容性（Chrome >= 90 等）是否定义测试矩阵？[NFR, Spec §Assumptions #8]
- [ ] CHK062 - 多 worker 并发测试的并发数量是否定义？[NFR, Gap, Playwright Testing]
- [ ] CHK063 - 无头模式测试的配置要求是否明确？[NFR, Gap, Playwright Testing]
- [ ] CHK064 - 拖拽功能的跨浏览器兼容性是否定义测试要求？[NFR, Gap, UI Drag-Drop]
- [ ] CHK065 - 连线校验功能的错误提示需求是否定义？[NFR, Gap, Connection Validation]
- [ ] CHK066 - 系统在低带宽或高延迟网络下的降级需求是否定义？[NFR, Gap]

## Dependencies & Assumptions

- [ ] CHK067 - 企业列表接口、资产详情接口的可用性假设是否已验证？[Dependency, Spec §Dependencies]
- [ ] CHK068 - 用户已通过身份认证的假设是否与实际认证流程一致？[Assumption, Spec §Assumptions #2]
- [ ] CHK069 - 字段信息静态假设（配置过程中不变）是否考虑并发修改场景？[Assumption, Spec §Assumptions #3]
- [ ] CHK070 - Vue Flow 库的拖放事件处理是否与现有项目兼容？[Dependency, Spec §Dependencies]
- [ ] CHK071 - 右侧详情面板组件的扩展性需求是否定义？[Dependency, Spec §Dependencies]
- [ ] CHK072 - Mock 数据与真实 API 响应格式的一致性是否验证？[Dependency, Tasks §T013/T014]
- [ ] CHK073 - 用户具有基本数据素养的假设是否影响 UI 设计需求？[Assumption, Spec §Assumptions #7]
- [ ] CHK074 - 单个资产最多 500 字段的假设是否与真实数据一致？[Assumption, Spec §Assumptions #9]

## Ambiguities & Conflicts

- [ ] CHK075 - "多步骤向导模式"是否允许跳过已完成的步骤直接返回？[Ambiguity, Spec §FR-002]
- [ ] CHK076 - "上一步/下一步导航"是否支持键盘快捷键？[Ambiguity, Gap]
- [ ] CHK077 - "立即删除节点"是否需要确认对话框还是直接删除？[Ambiguity, Spec §FR-020 vs Clarifications]
- [ ] CHK078 - "完整数据资产信息"是否包含所有字段还是仅已选字段？[Ambiguity, Spec §FR-021]
- [ ] CHK079 - "资产名称"的显示格式（完整名称 vs 截断 vs Tooltip）是否定义？[Ambiguity, Spec §FR-016]
- [ ] CHK080 - "日志记录关键操作"是否定义审计日志留存要求？[Ambiguity, Spec §FR-025]
- [ ] CHK081 - "多个 worker"并发测试是否定义测试数据隔离策略？[Ambiguity, Gap, Playwright]
- [ ] CHK082 - "连线校验功能"的具体校验规则是否在 spec 中定义？[Ambiguity, Gap, Connection Validation]

## Testability & Automation Coverage

- [ ] CHK083 - 所有用户故事是否都有对应的 E2E 测试用例？[Testability, Tasks §Tests for User Stories]
- [ ] CHK084 - 拖放功能的自动化测试是否定义无头模式下的可靠性保障？[Testability, Gap, Playwright]
- [ ] CHK085 - 连线校验功能的测试覆盖是否包含所有校验场景？[Testability, Gap, Connection Validation]
- [ ] CHK086 - Mock 数据是否覆盖所有 API 响应场景（成功、失败、空、部分数据）？[Testability, Tasks §T014]
- [ ] CHK087 - 性能测试（T052、T053）是否定义可重复执行的基准？[Testability, Tasks §T052/T053]
- [ ] CHK088 - 多 worker 并发测试是否定义执行顺序和依赖关系？[Testability, Gap, Playwright]
- [ ] CHK089 - 虚拟滚动性能测试是否定义测量工具和指标？[Testability, Tasks §T017]
- [ ] CHK090 - 搜索性能测试是否定义不同数据规模下的基准？[Testability, Spec §SC-005]

## Traceability

- [ ] CHK091 - 每个 FR 是否有对应的用户故事引用？[Traceability, Spec §Functional Requirements]
- [ ] CHK092 - 每个 SC 是否可追溯到具体的用户故事或 FR？[Traceability, Spec §Success Criteria]
- [ ] CHK093 - Edge Cases 是否追溯到对应的用户故事场景？[Traceability, Spec §Edge Cases]
- [ ] CHK094 - 任务（T001-T054）是否追溯到用户故事或阶段？[Traceability, Tasks §Organization]
- [ ] CHK095 - E2E 测试用例是否追溯到验收场景？[Traceability, Tasks §Tests for User Stories]
- [ ] CHK096 - Clarifications 中的决策是否更新到 spec.md 的对应章节？[Traceability, Spec §Clarifications]

---

## Summary

- **Total Items**: 96
- **Focus Areas**: UX/交互体验、API/数据契约、功能覆盖完整性、测试可验收性
- **Actor**: QA 团队
- **Timing**: 实施前需求验证
- **User-Specified Items**: Playwright 无头模式、多 worker 并发、UI 拖拽、连线校验

**Note**: 每次运行 /speckit.checklist 创建一个新文件，不覆盖现有检查清单。
