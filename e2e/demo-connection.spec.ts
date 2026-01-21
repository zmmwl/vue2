import { test, expect } from '@playwright/test';
import { dragNodeToCanvas } from './test-utils';

/**
 * 演示测试：创建两个节点并连接它们
 * 测试完成后停留在页面上，方便观察
 *
 * 使用方法:
 * - 不停留: npx playwright test e2e/demo-connection.spec.ts
 * - 停留10秒: OBSERVE_TIME=10 npx playwright test e2e/demo-connection.spec.ts
 */
test('演示：数据源节点连接到计算任务节点', async ({ page }) => {
  // 获取观察时间（秒），默认为 0（不停留）
  const observeTime = parseInt(process.env.OBSERVE_TIME || '0');

  await page.goto('/');
  await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

  console.log('📍 步骤 1: 拖拽数据源节点（MySQL）到画布');
  await dragNodeToCanvas(page, 'palette-node-mysql-数据库', 300, 150);
  await page.waitForTimeout(1000);
  console.log('✅ MySQL 节点已创建');

  console.log('📍 步骤 2: 拖拽计算任务节点（PSI）到画布');
  await dragNodeToCanvas(page, 'palette-node-psi-计算', 300, 350);
  await page.waitForTimeout(1000);
  console.log('✅ PSI 节点已创建');

  // 验证两个节点都已创建
  await expect(page.locator('.vue-flow__node')).toHaveCount(2);
  console.log('✅ 两个节点已就位');

  const nodes = page.locator('.vue-flow__node');
  const sourceBox = await nodes.nth(0).boundingBox();
  const targetBox = await nodes.nth(1).boundingBox();

  if (sourceBox && targetBox) {
    console.log('📍 步骤 3: 悬停在数据源节点上，显示连接 handle');
    // 悬停在源节点上以显示输出 handle
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.waitForTimeout(1500);

    console.log('📍 步骤 4: 从数据源节点的输出 handle 拖到计算任务节点的输入 handle');
    // 获取输出 handle（底部）和输入 handle（顶部）的位置
    const outputHandleX = sourceBox.x + sourceBox.width / 2;
    const outputHandleY = sourceBox.y + sourceBox.height - 5; // 底部

    const inputHandleX = targetBox.x + targetBox.width / 2;
    const inputHandleY = targetBox.y + 5; // 顶部

    // 先悬停目标节点，显示输入 handle
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.waitForTimeout(800);

    // 模拟拖拽连接
    await page.mouse.move(outputHandleX, outputHandleY);
    await page.waitForTimeout(500);
    await page.mouse.down();
    await page.waitForTimeout(300);

    // 慢慢拖动到目标 handle
    await page.mouse.move(inputHandleX, (outputHandleY + inputHandleY) / 2, { steps: 5 });
    await page.waitForTimeout(300);
    await page.mouse.move(inputHandleX, inputHandleY, { steps: 5 });
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // 验证连接线已创建
    const edgeCount = await page.locator('.vue-flow__edge').count();
    console.log(`✅ 连接完成！当前连接线数量: ${edgeCount}`);

    if (edgeCount > 0) {
      console.log('🎉 成功创建连接线！');
    } else {
      console.log('⚠️ 连接线未创建，可能是 handle 位置不准确');
    }

    if (observeTime > 0) {
      console.log('');
      console.log('========================================');
      console.log(`📊 测试完成！页面将停留 ${observeTime} 秒`);
      console.log('   你可以看到:');
      console.log('   - 上方: MySQL 数据源节点');
      console.log('   - 下方: PSI 计算任务节点');
      console.log('   - 连接线');
      console.log('========================================');

      // 停留指定时间
      await page.waitForTimeout(observeTime * 1000);
    } else {
      console.log('✅ 测试完成（无停留）');
    }
  }
});

test('不应该允许两个数据源节点直接连接', async ({ page }) => {
  const observeTime = parseInt(process.env.OBSERVE_TIME || '0');

  await page.goto('/');
  await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

  console.log('📍 步骤 1: 拖拽数据源节点（MySQL）到画布');
  await dragNodeToCanvas(page, 'palette-node-mysql-数据库', 300, 150);
  await page.waitForTimeout(1000);
  console.log('✅ MySQL 节点已创建');

  console.log('📍 步骤 2: 拖拽另一个数据源节点（PostgreSQL）到画布');
  await dragNodeToCanvas(page, 'palette-node-postgresql', 300, 350);
  await page.waitForTimeout(1000);
  console.log('✅ PostgreSQL 节点已创建');

  // 验证两个节点都已创建
  await expect(page.locator('.vue-flow__node')).toHaveCount(2);
  console.log('✅ 两个数据源节点已就位');

  const nodes = page.locator('.vue-flow__node');
  const sourceBox = await nodes.nth(0).boundingBox();
  const targetBox = await nodes.nth(1).boundingBox();

  if (sourceBox && targetBox) {
    console.log('📍 步骤 3: 悬停在第一个数据源节点上，显示连接 handle');
    // 悬停在源节点上以显示输出 handle
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.waitForTimeout(1500);

    console.log('📍 步骤 4: 尝试从第一个数据源节点的输出 handle 拖到第二个数据源节点的输出 handle（底部）');
    // 获取第一个节点的输出 handle（底部）位置
    const outputHandleX = sourceBox.x + sourceBox.width / 2;
    const outputHandleY = sourceBox.y + sourceBox.height - 5; // 底部

    // 获取第二个节点的输出 handle（底部）位置
    const targetOutputHandleX = targetBox.x + targetBox.width / 2;
    const targetOutputHandleY = targetBox.y + targetBox.height - 5; // 底部

    // 先悬停第二个节点，显示其输出 handle
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.waitForTimeout(800);

    // 记录初始连接线数量
    const initialEdgeCount = await page.locator('.vue-flow__edge').count();

    // 模拟拖拽连接 - 从第一个节点的底部拖到第二个节点的底部
    await page.mouse.move(outputHandleX, outputHandleY);
    await page.waitForTimeout(500);
    await page.mouse.down();
    await page.waitForTimeout(300);

    // 慢慢拖动到第二个节点的底部输出 handle
    await page.mouse.move(targetOutputHandleX, (outputHandleY + targetOutputHandleY) / 2, { steps: 5 });
    await page.waitForTimeout(300);
    await page.mouse.move(targetOutputHandleX, targetOutputHandleY, { steps: 5 });
    await page.waitForTimeout(300);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // 验证连接线结果
    const finalEdgeCount = await page.locator('.vue-flow__edge').count();
    console.log(`初始连接线数量: ${initialEdgeCount}`);
    console.log(`尝试连接后连接线数量: ${finalEdgeCount}`);

    // 当前实现允许两个数据源节点通过输出 handle 连接
    // 这是一个已知的业务逻辑缺陷，应该被修复
    if (finalEdgeCount > initialEdgeCount) {
      console.log('⚠️ 当前实现允许了两个数据源节点通过输出 handle 连接（这是不正确的）');
      console.log('   期望行为：两个数据源节点不应该能够直接连接');
      console.log('   实际行为：连接线已创建');
    }

    // 这个测试目前会失败，因为它揭示了业务逻辑的缺陷
    // TODO: 修复业务逻辑，禁止两个数据源节点直接连接
    expect(finalEdgeCount).toBe(initialEdgeCount);
    console.log('✅ 测试完成');

    if (observeTime > 0) {
      console.log('');
      console.log('========================================');
      console.log(`📊 测试完成！页面将停留 ${observeTime} 秒`);
      console.log('   你可以看到:');
      console.log('   - 上方: MySQL 数据源节点');
      console.log('   - 下方: PostgreSQL 数据源节点');
      console.log(`   - ${finalEdgeCount > initialEdgeCount ? '有连接线（业务逻辑需要修复）' : '没有连接线'}`);
      console.log('========================================');

      // 停留指定时间
      await page.waitForTimeout(observeTime * 1000);
    }
  }
});
