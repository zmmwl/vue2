<!--
Sync Impact Report:
- Version: None -> 1.0.0 (Initial ratification)
- Modified principles: N/A (Initial version)
- Added sections: All sections (Core Principles, Development Standards, Testing Standards, Governance)
- Removed sections: N/A (Initial version)
- Templates requiring updates:
  - .specify/templates/plan-template.md - ✅ Constitution Check section will reference these principles
  - .specify/templates/spec-template.md - ✅ Requirements alignment verified
  - .specify/templates/tasks-template.md - ✅ Task categorization aligned
- Follow-up TODOs: None
-->

# Privacy Computing Flow Editor Constitution

## Core Principles

### I. Visual-First Design

所有功能优先考虑可视化交互体验。用户通过拖拽、连接节点来构建DAG任务图，而非编写代码或配置文件。

- **所见即所得**：画布上的操作实时反映到数据模型中
- **交互反馈**：每个用户操作（拖拽、连接、选中）都应有明确的视觉反馈
- **减少认知负担**：通过视觉设计降低隐私计算概念的复杂度（如颜色区分节点类型、动画显示数据流向）

**理由**：隐私计算涉及复杂概念（PSI、PIR、MPC等），可视化编辑器能降低技术门槛，使非专家用户也能编排任务。

### II. 前端自治原则

前端应用必须能够在不依赖后端服务的情况下运行和开发。

- **Mock优先**：所有后端接口调用必须有对应的Mock实现
- **离线开发**：开发者可以在无网络、无后端环境下完成全部功能开发
- **数据隔离**：前端状态管理与后端API调用分离，便于测试

**理由**：前端开发不应被后端进度阻塞。Mock测试桩确保开发效率和测试稳定性。

### III. 标准化输出

系统生成的DAG任务图必须符合标准JSON格式，确保与后端服务的互操作性。

- **Schema定义**：输出JSON必须有明确的类型定义（TypeScript interfaces）
- **向后兼容**：格式变更必须考虑已有任务的兼容性
- **验证机制**：导出前必须验证生成的JSON结构完整性

**理由**：标准化输出是前端编辑器与后端执行引擎之间的契约，确保任务可被正确解析和执行。

### IV. 组件化架构

UI组件必须遵循单一职责原则，保持高度可复用性。

- **节点组件**：DataSourceNode、ComputeTaskNode等节点组件独立封装
- **可组合性**：Header、Sidebar、Canvas等区域组件可独立开发和测试
- **Props契约**：组件间通过明确定义的Props通信，避免隐式依赖

**理由**：组件化架构支持增量开发，便于维护和扩展新的节点类型。

### V. 类型安全

所有代码必须使用TypeScript编写，充分利用静态类型检查。

- **无Any类型**：禁止使用`any`类型，未定义类型必须声明接口
- **严格模式**：启用`strict: true`编译选项
- **类型导出**：公共类型定义在`types/`目录，便于跨组件复用

**理由**：隐私计算涉及复杂的数据结构和状态，类型安全能减少运行时错误。

## Development Standards

### 代码风格

- 使用Vue 3 Composition API编写组件
- 优先使用`<script setup>`语法
- 样式使用SCSS，变量统一定义在`assets/styles/variables.scss`
- 遵循n8n设计语言风格

### 文件组织

```
src/
├── components/     # 可复用UI组件
│   ├── Flow/      # 画布相关组件
│   ├── Nodes/     # 节点组件
│   └── Edges/     # 连接线组件
├── views/         # 页面级组件
├── types/         # TypeScript类型定义
└── utils/         # 工具函数和常量
```

### Git提交规范

- `feat`: 新功能
- `fix`: 修复bug
- `refactor`: 重构（不改变功能）
- `test`: 添加测试
- `docs`: 文档更新
- `chore`: 构建/工具配置更新

## Testing Standards

### 测试分层

1. **组件测试**：使用Playwright测试关键用户交互流程
2. **类型检查**：每次构建前必须通过`vue-tsc`类型检查
3. **手动验证**：复杂交互需在浏览器中手动验证

### 测试覆盖要求

- 所有新增节点类型必须有对应的拖拽测试
- 连接验证逻辑必须有测试覆盖
- JSON导出功能必须验证输出格式正确性

### Mock规范

Mock数据定义在`tests/mocks/`目录，模拟：
- 节点模板数据
- 后端API响应
- 复杂的图结构场景

## Governance

### 宪章修订流程

1. 提出修订建议并说明理由
2. 评估影响范围（模板文件、现有代码）
3. 更新宪章并递增版本号
4. 同步更新依赖的模板文件
5. 通知团队成员变更内容

### 版本控制

采用语义化版本：`MAJOR.MINOR.PATCH`
- **MAJOR**：移除或重新定义核心原则
- **MINOR**：新增原则或实质性扩展指导
- **PATCH**：澄清措辞、修正错误、非语义优化

### 合规性审查

所有PR必须确认：
- [ ] 代码符合类型安全原则
- [ ] 新功能有对应的Mock实现
- [ ] 组件变更不影响现有可视化交互
- [ ] 输出JSON格式保持标准化

### 运行时指导

开发过程中遇到本宪章未覆盖的情况，参考[CLAUDE.md](../CLAUDE.md)获取具体实现指导。

**Version**: 1.0.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-21
