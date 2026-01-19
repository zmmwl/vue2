# E2E 测试指南

本项目使用 Playwright 进行端到端（E2E）测试，可以自动测试 Vue Flow 流程编辑器的核心功能。

## 测试覆盖范围

### 节点拖拽测试 (drag-drop.spec.ts)
- 从侧边栏拖拽数据源节点到画布
- 拖拽多个不同类型的节点
- 拖拽所有数据源类型（MySQL、PostgreSQL、CSV、Excel、REST API、GraphQL）
- 拖拽所有计算任务类型（PSI、PIR、MPC、联邦学习、同态加密、差分隐私）
- 连续拖拽多个节点到不同位置

### 节点操作测试 (node-operations.spec.ts)
- 点击选中节点
- 取消选中节点
- 删除节点（Delete 键）
- 删除多个节点
- 操作多个节点
- 节点悬停显示连接 handles
- 使用画布控制按钮（缩放、适应视图）
- 使用 MiniMap
- 选择单个节点

### 连接线测试 (connections.spec.ts)
- 显示节点的连接 handles
- 验证连接线的样式元素
- 删除节点时的连接线逻辑
- 节点选择和操作
- 多节点操作
- CSS 类正确应用

## 运行测试

```bash
# 运行所有测试（无头模式）
npm test

# 使用 UI 模式运行测试（可以看到浏览器操作）
npm run test:ui

# 使用有头模式运行测试
npm run test:headed

# 调试模式
npm run test:debug

# 查看测试报告
npm run test:report
```

## 测试结果

所有 26 个测试用例均已通过：

```
✓ 节点拖拽测试 (6)
✓ 节点操作测试 (10)
✓ 连接线测试 (6)
✓ 调试测试 (2)
✓ UI 调试测试 (2)
```

## 配置文件

- `playwright.config.ts` - Playwright 配置
- `e2e/` - 测试用例目录

## 技术栈

- **Playwright** - 浏览器自动化测试框架
- **Vue Flow** - 流程图库（被测试的库）
- **Vite** - 开发服务器（测试时自动启动）

## 注意事项

1. **Vite 缓存问题**：如果测试失败，尝试清除 Vite 缓存：
   ```bash
   rm -rf node_modules/.vite
   npm test
   ```

2. **浏览器安装**：首次运行前需要安装 Playwright 浏览器：
   ```bash
   npx playwright install chromium
   ```

3. **测试 ID**：组件使用 `data-testid` 属性进行测试选择器定位

## 使用 Playwright MCP 插件

项目中已配置 Playwright MCP 插件，可以用来手动操作浏览器进行测试：

- `browser_navigate` - 导航到 URL
- `browser_click` - 点击元素
- `browser_drag` - 拖拽操作
- `browser_snapshot` - 获取页面快照
- `browser_take_screenshot` - 截图
