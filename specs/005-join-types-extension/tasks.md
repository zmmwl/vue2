# Tasks: Join 类型扩展

**Input**: Design documents from `/specs/005-join-types-extension/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: 包含测试任务（基于项目的 Playwright 测试规范）

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目基础设施验证

- [x] T001 Verify TypeScript 5.9.3 and Vue 3.5.24 environment is ready
- [x] T002 [P] Verify @vue-flow/core 1.48.1 dependency is installed
- [x] T003 [P] Verify Playwright 1.57.0 is configured for E2E testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type system that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type System Extension

- [x] T004 Add JoinType union type ('INNER' | 'CROSS' | 'Union' | 'NoAssoc') in src/types/nodes.ts
- [x] T005 [P] Update FieldMapping interface joinType field to use JoinType in src/types/nodes.ts
- [x] T006 [P] Add UnionFieldMapping interface in src/types/nodes.ts
- [x] T007 Update InputProvider interface: add joinType and unionFieldMappings fields in src/types/nodes.ts
- [x] T008 [P] Update JoinCondition interface joinType to use JoinType in src/types/nodes.ts
- [x] T009 Update export types to support new JoinType values in src/types/export.ts
- [x] T010 Run `npm run build` to verify no TypeScript errors

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 配置 Union(横向拼接) 类型 (Priority: P1) 🎯 MVP

**Goal**: 实现 Union 类型的字段对齐配置界面，让用户能够横向拼接多个数据源

**Independent Test**: 添加两个数据源、选择 Union 类型、配置字段映射、验证输出结果

### Implementation for User Story 1

- [x] T011 [US1] Update join type selector to include Union option in src/components/Modals/InputProviderConfig.vue
- [x] T012 [US1] Hide join field checkbox when Union type is selected in src/components/Modals/InputProviderConfig.vue
- [x] T013 [US1] Create UnionFieldAligner.vue component with mode selector in src/components/Modals/UnionFieldAligner.vue
- [x] T014 [P] [US1] Create TableMode.vue for table-based field alignment in src/components/Modals/union-align/TableMode.vue
- [x] T015 [P] [US1] Create ColumnAlignMode.vue for drag-and-drop column alignment in src/components/Modals/union-align/ColumnAlignMode.vue
- [x] T016 [P] [US1] Create FieldMappingMode.vue for field-by-field mapping in src/components/Modals/union-align/FieldMappingMode.vue
- [x] T017 [US1] Integrate UnionFieldAligner into InputProviderConfig.vue when Union type selected
- [x] T018 [US1] Add real-time preview panel showing aligned field structure in UnionFieldAligner.vue
- [x] T019 [US1] Update join-builder.ts to handle Union type (generate empty operands) in src/utils/join-builder.ts
- [x] T020 [US1] Display Union type label correctly in src/components/Flow/FlowDetailPanel.vue
- [x] T021 [US1] Handle type switching: clear unionFieldMappings when switching from Union to other types in src/components/Modals/InputProviderConfig.vue

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 配置 NoAssoc(无关联) 类型 (Priority: P1)

**Goal**: 实现 NoAssoc 类型，让用户能够标记数据源为独立处理，跳过 join 字段校验

**Independent Test**: 添加数据源、选择 NoAssoc 类型、验证无需选择 join 字段即可保存

### Implementation for User Story 2

- [x] T022 [US2] Update join type selector to include NoAssoc option in src/components/Modals/InputProviderConfig.vue
- [x] T023 [US2] Disable join field checkbox when NoAssoc type is selected in src/components/Modals/InputProviderConfig.vue
- [x] T024 [US2] Remove join field validation requirement when NoAssoc type is selected in src/components/Modals/InputProviderConfig.vue
- [x] T025 [US2] Update join-builder.ts to handle NoAssoc type (generate empty operands) in src/utils/join-builder.ts
- [x] T026 [US2] Display NoAssoc type label correctly in src/components/Flow/FlowDetailPanel.vue
- [x] T027 [US2] Handle type switching: clear joinFields when switching to NoAssoc in src/components/Modals/InputProviderConfig.vue

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 优化 CROSS(交叉连接) 类型配置 (Priority: P2)

**Goal**: 优化 CROSS 类型的配置体验，置灰 join 字段复选框，去除必填校验

**Independent Test**: 选择 CROSS 类型、验证 join 字段复选框被置灰且无必填校验

### Implementation for User Story 3

- [x] T028 [US3] Disable join field checkbox when CROSS type is selected in src/components/Modals/InputProviderConfig.vue
- [x] T029 [US3] Remove join field validation requirement when CROSS type is selected in src/components/Modals/InputProviderConfig.vue
- [x] T030 [US3] Handle type switching: clear joinFields when switching to CROSS, prompt for join fields when switching to INNER in src/components/Modals/InputProviderConfig.vue

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should all work independently

---

## Phase 6: User Story 4 - 类型共存规则校验 (Priority: P2)

**Goal**: 实现类型兼容性校验，在不兼容组合时显示内联警告并禁用保存按钮

**Independent Test**: 配置不同类型组合、验证校验逻辑是否正确触发

### Implementation for User Story 4

- [x] T031 [US4] Create join-validation.ts with type compatibility matrix in src/utils/join-validation.ts
- [x] T032 [US4] Implement validateJoinCompatibility() function in src/utils/join-validation.ts
- [x] T033 [US4] Implement CROSS count limit check (max 1) in src/utils/join-validation.ts
- [x] T034 [US4] Create useJoinValidation composable with reactive validation results in src/composables/useJoinValidation.ts
- [x] T035 [US4] Integrate validation into InputProviderConfig.vue - show inline warning on conflict in src/components/Modals/InputProviderConfig.vue
- [x] T036 [US4] Disable save button when type conflicts exist in src/components/Modals/InputProviderConfig.vue
- [x] T037 [US4] Add conflict resolution hints to warning messages in src/components/Modals/InputProviderConfig.vue

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T038 [P] Add E2E test for Union type configuration in tests/e2e/join-types.spec.ts
- [x] T039 [P] Add E2E test for NoAssoc type configuration in tests/e2e/join-types.spec.ts
- [x] T040 [P] Add E2E test for CROSS type optimization in tests/e2e/join-types.spec.ts
- [x] T041 [P] Add E2E test for type compatibility validation in tests/e2e/join-types.spec.ts
- [x] T042 [P] Add unit tests for join-validation.ts in tests/unit/join-validation.test.ts
- [x] T043 Run `npm run build` to verify final build passes
- [X] T044 Run all E2E tests to verify feature completeness
- [ ] T045 Validate quickstart.md test scenarios manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Union) and US2 (NoAssoc) can proceed in parallel (both P1)
  - US3 (CROSS) and US4 (Validation) can proceed in parallel (both P2)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1/US2/US3 types being available for validation

### Within Each User Story

- UI components before business logic
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- US1 and US2 can be worked on in parallel (both P1)
- US3 and US4 can be worked on in parallel (both P2)
- Within US1: T014, T015, T016 (three alignment modes) can run in parallel
- All E2E tests (T038-T041) can run in parallel
- Unit tests (T042) can run in parallel with E2E tests

---

## Parallel Example: User Story 1 (Union)

```bash
# After T011-T013 complete, launch all mode components together:
Task: "Create TableMode.vue for table-based field alignment in src/components/Modals/union-align/TableMode.vue"
Task: "Create ColumnAlignMode.vue for drag-and-drop column alignment in src/components/Modals/union-align/ColumnAlignMode.vue"
Task: "Create FieldMappingMode.vue for field-by-field mapping in src/components/Modals/union-align/FieldMappingMode.vue"
```

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational phase complete, launch both P1 stories together:
# Developer A: User Story 1 (Union)
# Developer B: User Story 2 (NoAssoc)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Union)
4. Complete Phase 4: User Story 2 (NoAssoc)
5. **STOP and VALIDATE**: Test Union and NoAssoc independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Union) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (NoAssoc) → Test independently → Deploy/Demo
4. Add User Story 3 (CROSS optimization) → Test independently → Deploy/Demo
5. Add User Story 4 (Validation) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Union)
   - Developer B: User Story 2 (NoAssoc)
3. After P1 stories complete:
   - Developer A: User Story 3 (CROSS)
   - Developer B: User Story 4 (Validation)
4. Stories complete and integrate independently

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 45 |
| Setup Tasks | 3 |
| Foundational Tasks | 7 |
| User Story 1 Tasks | 11 |
| User Story 2 Tasks | 6 |
| User Story 3 Tasks | 3 |
| User Story 4 Tasks | 7 |
| Polish Tasks | 8 |
| Parallel Opportunities | 18 tasks marked [P] |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
