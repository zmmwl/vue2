<template>
  <header class="flow-header">
    <div class="header-left">
      <h1 class="header-title">隐私计算任务流</h1>
      <span class="header-status">未保存</span>
    </div>
    <div class="header-right">
      <button class="header-btn primary">运行</button>
      <button class="header-btn">保存</button>
      <button class="header-btn" @click="handleExport">导出</button>
      <button class="header-btn" @click="handleImport">导入</button>
      <button class="header-btn">设置</button>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'export'): void
  (e: 'import'): void
}

const emit = defineEmits<Emits>()

function handleExport() {
  emit('export')
}

function handleImport() {
  emit('import')
}
</script>

<style scoped lang="scss">
.flow-header {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.header-status {
  font-size: 12px;
  color: #666666;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #666666;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
    color: #1890ff;
  }

  &.primary {
    background: #1890ff;
    color: #ffffff;
    border-color: #1890ff;

    &:hover {
      background: #40a9ff;
      border-color: #40a9ff;
      color: #ffffff;
    }
  }
}
</style>
