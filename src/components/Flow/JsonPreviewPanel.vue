<template>
  <div class="json-preview-panel">
    <div v-if="json" class="json-content">
      <pre class="json-code">{{ formattedJson }}</pre>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">{}</div>
      <p class="empty-text">暂无 JSON 预览</p>
      <p class="empty-hint">添加节点后实时预览导出内容</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExportJson } from '@/types/export'

interface Props {
  json: ExportJson | null
}

const props = defineProps<Props>()

/**
 * 格式化 JSON 显示
 */
const formattedJson = computed(() => {
  if (!props.json) return ''
  return JSON.stringify(props.json, null, 2)
})
</script>

<style scoped lang="scss">
.json-preview-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.json-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.json-code {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #24292e;
  white-space: pre;
  word-break: break-all;

  // JSON 语法高亮
  :deep(.string) {
    color: #032f62;
  }

  :deep(.number) {
    color: #005cc5;
  }

  :deep(.boolean) {
    color: #d73a49;
  }

  :deep(.null) {
    color: #6f42c1;
  }

  :deep(.key) {
    color: #22863a;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}

.empty-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

// 滚动条样式
.json-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.json-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
