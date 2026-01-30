<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container enterprise-selector-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">选择企业</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <div v-if="sortedEnterprises.length === 0" class="empty-state">
              <div class="empty-icon">📄</div>
              <p>暂无可选企业</p>
            </div>

            <div v-else class="enterprise-list">
              <div
                v-for="enterprise in sortedEnterprises"
                :key="enterprise.id"
                class="enterprise-item"
                :class="{ 'is-selected': selectedEnterpriseId === enterprise.id }"
                @click="selectEnterprise(enterprise.id)"
              >
                <div class="enterprise-icon">
                  {{ enterprise.name.charAt(0) }}
                </div>
                <div class="enterprise-info">
                  <div class="enterprise-name">{{ enterprise.name }}</div>
                  <div class="enterprise-type">
                    <span
                      class="type-tag"
                      :class="getResourceTypeClass(enterprise.resourceType)"
                    >
                      {{ getResourceTypeName(enterprise.resourceType) }}
                    </span>
                  </div>
                </div>
                <div v-if="selectedEnterpriseId === enterprise.id" class="check-icon">
                  ✓
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel()">取消</button>
            <button
              class="btn btn-primary"
              :disabled="!selectedEnterpriseId"
              @click="handleConfirm()"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EnterpriseOption } from '@/types/nodes'
import { ResourceTypePriority } from '@/types/nodes'

interface Props {
  modelValue: boolean
  enterprises: EnterpriseOption[]
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', enterpriseId: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 按资源类型优先级排序的企业列表
const sortedEnterprises = computed(() => {
  return [...props.enterprises].sort((a, b) => {
    // 首先按资源类型优先级排序
    if (a.resourceType !== b.resourceType) {
      return b.resourceType - a.resourceType
    }
    // 相同优先级按名称字母序排序
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 重置选择
    selectedEnterpriseId.value = ''
  }
})

/**
 * 选择企业
 */
function selectEnterprise(enterpriseId: string) {
  selectedEnterpriseId.value = enterpriseId
}

/**
 * 获取资源类型标签样式类
 */
function getResourceTypeClass(type: ResourceTypePriority): string {
  switch (type) {
    case ResourceTypePriority.DATA:
      return 'type-success'
    case ResourceTypePriority.MODEL:
      return 'type-warning'
    case ResourceTypePriority.COMPUTE:
      return 'type-info'
    default:
      return 'type-primary'
  }
}

/**
 * 获取资源类型名称
 */
function getResourceTypeName(type: ResourceTypePriority): string {
  switch (type) {
    case ResourceTypePriority.DATA:
      return '数据资源企业'
    case ResourceTypePriority.MODEL:
      return '模型所属企业'
    case ResourceTypePriority.COMPUTE:
      return '算力所属企业'
    default:
      return '其他企业'
  }
}

/**
 * 处理确认
 */
function handleConfirm() {
  if (!selectedEnterpriseId.value) return

  emit('confirm', selectedEnterpriseId.value)
  handleClose()
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel')
  handleClose()
}

/**
 * 处理关闭
 */
function handleClose() {
  emit('update:modelValue', false)
  selectedEnterpriseId.value = ''
}
</script>

<style scoped lang="scss">
.enterprise-selector-modal {
  max-width: 600px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.enterprise-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.enterprise-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ecf5ff;
    border-color: #b3d8ff;
  }

  &.is-selected {
    background: #f0f9ff;
    border-color: #409eff;
  }
}

.enterprise-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
}

.enterprise-info {
  flex: 1;
  min-width: 0;
}

.enterprise-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.enterprise-type {
  .type-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;

    &.type-success {
      background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
      color: #1890FF;
    }

    &.type-warning {
      background: linear-gradient(135deg, #FFF7E6, #FFD591);
      color: #FA8C16;
    }

    &.type-info {
      background: linear-gradient(135deg, #E6FFFB, #87E8DE);
      color: #13C2C2;
    }

    &.type-primary {
      background: linear-gradient(135deg, #F9F0FF, #D3ADF7);
      color: #722ED1;
    }
  }
}

.check-icon {
  flex-shrink: 0;
  font-size: 20px;
  color: #409eff;
}

// 模态框基础样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: #ffffff;
  border-radius: 8px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #000000;
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background-color: #ffffff;
  border-color: #d9d9d9;
  color: #000000;

  &:hover:not(:disabled) {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;

  &:hover:not(:disabled) {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
}

// 自定义滚动条
.enterprise-list::-webkit-scrollbar {
  width: 6px;
}

.enterprise-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.enterprise-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background: #c0c4cc;
  }
}

// Transition 动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;

  .modal-container {
    transition: transform 0.2s;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.9);
  }
}
</style>
