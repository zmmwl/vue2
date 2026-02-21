<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content model-selector-modal">
        <div class="modal-header">
          <h3>选择已部署模型</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 搜索框 -->
          <div class="search-box">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜索模型名称..."
              class="search-input"
            />
          </div>

          <!-- 模型列表 -->
          <div class="model-list">
            <div v-if="isLoading" class="loading-state">
              <span class="loading-icon">⏳</span>
              <span>加载中...</span>
            </div>

            <div v-else-if="filteredModels.length === 0" class="empty-state">
              <span class="empty-icon">🔍</span>
              <span>{{ searchKeyword ? '未找到匹配的模型' : '暂无已部署的模型' }}</span>
            </div>

            <div
              v-else
              v-for="model in filteredModels"
              :key="model.modelId"
              class="model-item"
              :class="{ 'is-selected': selectedModelId === model.modelId }"
              @click="handleSelect(model)"
            >
              <div class="model-icon">{{ getModelIcon(model.modelType) }}</div>
              <div class="model-info">
                <div class="model-name">{{ model.modelName }}</div>
                <div class="model-meta">
                  <span class="model-type">{{ getModelTypeLabel(model.modelType) }}</span>
                  <span class="model-participants">{{ model.participants.length }} 参与方</span>
                </div>
              </div>
              <div v-if="selectedModelId === model.modelId" class="selected-mark">✓</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-confirm" @click="handleConfirm" :disabled="!selectedModelId">
            确认
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DeployedModel } from '@/types/nodes'
import { DEPLOYED_MODELS } from '@/utils/mock-fl-data'

const props = defineProps<{
  modelValue: boolean
  modelTypeFilter?: string // 'horizontal' | 'vertical'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', model: DeployedModel): void
}>()

const searchKeyword = ref('')
const isLoading = ref(false)
const selectedModelId = ref<string | null>(null)

// 过滤后的模型列表
const filteredModels = computed(() => {
  let models = [...DEPLOYED_MODELS]

  // 按类型过滤
  if (props.modelTypeFilter) {
    models = models.filter(m => m.modelType === props.modelTypeFilter)
  }

  // 按关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    models = models.filter(m =>
      m.modelName.toLowerCase().includes(keyword) ||
      m.modelId.toLowerCase().includes(keyword)
    )
  }

  return models
})

// 获取模型图标
function getModelIcon(type?: string): string {
  if (type === 'horizontal') return '➡️'
  if (type === 'vertical') return '⬇️'
  return '🤖'
}

// 获取模型类型标签
function getModelTypeLabel(type?: string): string {
  if (type === 'horizontal') return '横向模型'
  if (type === 'vertical') return '纵向模型'
  return '未知类型'
}

// 处理选择
function handleSelect(model: DeployedModel) {
  selectedModelId.value = model.modelId
}

// 处理确认
function handleConfirm() {
  const model = filteredModels.value.find(m => m.modelId === selectedModelId.value)
  if (model) {
    emit('select', model)
  }
  handleClose()
}

// 处理关闭
function handleClose() {
  emit('update:modelValue', false)
}

// 重置状态
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedModelId.value = null
    searchKeyword.value = ''
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.model-selector-modal {
  width: 480px;
  max-width: 90vw;
  max-height: 70vh;
  background: var(--bg-secondary);
  border-radius: var(--dialog-border-radius);
  box-shadow: var(--shadow-dialog-overlay);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--dialog-header-padding);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  flex: 1;
  padding: var(--dialog-body-padding);
  overflow-y: auto;
}

.search-box {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--input-border);
  border-radius: var(--input-radius);
  font-size: 13px;
  background: var(--input-bg);
  transition: var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--input-border-focus);
    box-shadow: var(--input-shadow-focus);
  }
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 13px;

  .loading-icon,
  .empty-icon {
    font-size: 24px;
    opacity: 0.5;
  }
}

.model-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
  }

  &.is-selected {
    background: rgba(24, 144, 255, 0.08);
    border-color: var(--color-primary);
  }

  .model-icon {
    font-size: 24px;
  }

  .model-info {
    flex: 1;

    .model-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .model-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--text-secondary);
    }
  }

  .selected-mark {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: var(--dialog-footer-padding);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn-cancel,
.btn-confirm {
  padding: var(--button-sm-padding);
  border-radius: var(--button-sm-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
}

.btn-cancel {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.btn-confirm {
  border: none;
  background: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
