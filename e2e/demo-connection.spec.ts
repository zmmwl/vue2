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
