<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container json-preview-modal" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">JSON 预览</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <div class="json-info">
              <span class="json-stat">版本: {{ jsonData?.version || '-' }}</span>
              <span class="json-stat">节点: {{ jsonData?.nodes?.length || 0 }}</span>
              <span class="json-stat">连线: {{ jsonData?.edges?.length || 0 }}</span>
            </div>
            <pre class="json-content">{{ formattedJson }}</pre>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="onCancel">
              关闭
            </button>
            <button
              class="btn btn-confirm"
              @click="onDownload"
            >
              💾 下载 JSON
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExportedGraph } from '@/utils/exportUtils'
import { downloadJson } from '@/utils/exportUtils'

interface Props {
  visible: boolean
  jsonData: ExportedGraph | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 格式化的 JSON
const formattedJson = computed(() => {
  if (!props.jsonData) return ''
  return JSON.stringify(props.jsonData, null, 2)
})

// 下载 JSON
function onDownload() {
  if (formattedJson.value) {
    downloadJson(formattedJson.value)
  }
}

// 取消
function onCancel() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  transition: var(--button-transition);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.json-info {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.json-stat {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 6px;
  color: var(--datasource-blue);
  font-weight: 600;
}

.json-content {
  margin: 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  color: var(--text-primary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.btn-confirm {
  background: linear-gradient(135deg, #1890ff, #0284C7);
  color: white;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
