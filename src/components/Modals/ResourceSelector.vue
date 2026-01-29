<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container resource-modal" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">配置算力资源</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <!-- 选择算力提供方企业 -->
            <div class="config-section">
              <div class="section-title">
                <span class="step-number">1</span>
                选择算力提供方企业
              </div>
              <div class="enterprise-list">
                <div
                  v-for="enterprise in sortedEnterprises"
                  :key="enterprise.id"
                  class="enterprise-option"
                  :class="{ selected: selectedEnterpriseId === enterprise.id }"
                  @click="onSelectEnterprise(enterprise.id)"
                >
                  <div class="enterprise-radio">
                    <input
                      type="radio"
                      :name="'resource-enterprise'"
                      :value="enterprise.id"
                      v-model="selectedEnterpriseId"
                    />
                  </div>
                  <div class="enterprise-info">
                    <div class="enterprise-name">{{ enterprise.name }}</div>
                    <div class="enterprise-type">{{ getResourceTypeLabel(enterprise.resourceType) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 配置资源参数 -->
            <div v-if="selectedEnterpriseId" class="config-section">
              <div class="section-title">
                <span class="step-number">2</span>
                配置资源参数
              </div>

              <div class="resource-config">
                <!-- CPU 配置 -->
                <div class="config-item">
                  <label class="config-label">CPU 核心数</label>
                  <div class="config-input-group">
                    <input
                      type="number"
                      v-model.number="cpu"
                      min="1"
                      max="128"
                      class="config-input"
                      placeholder="输入 CPU 核心数"
                    />
                    <span class="config-unit">核</span>
                  </div>
                  <div class="config-presets">
                    <button
                      v-for="preset in [4, 8, 16, 32, 64]"
                      :key="preset"
                      class="preset-btn"
                      :class="{ active: cpu === preset }"
                      @click="cpu = preset"
                    >
                      {{ preset }}
                    </button>
                  </div>
                </div>

                <!-- 内存配置 -->
                <div class="config-item">
                  <label class="config-label">内存大小</label>
                  <div class="config-input-group">
                    <input
                      type="number"
                      v-model.number="memory"
                      min="1"
                      max="512"
                      class="config-input"
                      placeholder="输入内存大小"
                    />
                    <span class="config-unit">GB</span>
                  </div>
                  <div class="config-presets">
                    <button
                      v-for="preset in [8, 16, 32, 64, 128]"
                      :key="preset"
                      class="preset-btn"
                      :class="{ active: memory === preset }"
                      @click="memory = preset"
                    >
                      {{ preset }}
                    </button>
                  </div>
                </div>

                <!-- GPU 配置 -->
                <div class="config-item">
                  <label class="config-label">
                    <input type="checkbox" v-model="useGPU" />
                    <span>启用 GPU</span>
                  </label>
                  <div v-if="useGPU" class="gpu-config">
                    <div class="config-input-group">
                      <input
                        type="number"
                        v-model.number="gpu"
                        min="1"
                        max="8"
                        class="config-input"
                        placeholder="GPU 数量"
                      />
                      <span class="config-unit">张</span>
                    </div>
                    <select v-model="gpuType" class="config-select">
                      <option value="">选择 GPU 型号</option>
                      <option value="T4">NVIDIA T4</option>
                      <option value="V100">NVIDIA V100</option>
                      <option value="A100">NVIDIA A100</option>
                      <option value="A10">NVIDIA A10</option>
                      <option value="RTX3090">NVIDIA RTX 3090</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 资源摘要 -->
            <div v-if="selectedEnterpriseId" class="resource-summary">
              <span class="summary-label">预计配置:</span>
              <div class="summary-items">
                <span class="summary-item">{{ cpu }} 核 CPU</span>
                <span class="summary-item">{{ memory }} GB 内存</span>
                <span v-if="useGPU" class="summary-item">{{ gpu }} 张 {{ gpuType || 'GPU' }}</span>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="onCancel">
              取消
            </button>
            <button
              class="btn btn-confirm"
              :disabled="!canConfirm"
              @click="onConfirm"
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
import type { EnterpriseOption } from '@/types/contracts'

interface ResourceConfig {
  participantId: string
  cpu: number
  memory: number
  gpu?: number
  gpuType?: string
}

interface Props {
  visible: boolean
  recommendedEnterprises?: EnterpriseOption[]
  initialConfig?: ResourceConfig
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', config: ResourceConfig): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  recommendedEnterprises: () => [],
  initialConfig: undefined
})

const emit = defineEmits<Emits>()

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 资源配置
const cpu = ref<number>(8)
const memory = ref<number>(16)
const useGPU = ref<boolean>(false)
const gpu = ref<number>(1)
const gpuType = ref<string>('')

// 企业排序（按资源类型优先级 - 算力资源优先）
const sortedEnterprises = computed(() => {
  return [...props.recommendedEnterprises].sort((a, b) => {
    // 优先显示算力资源 (resourceType = 1)
    const aIsCompute = a.resourceType === 1
    const bIsCompute = b.resourceType === 1
    if (aIsCompute && !bIsCompute) return -1
    if (!aIsCompute && bIsCompute) return 1
    const weightDiff = (b.resourceType ?? 0) - (a.resourceType ?? 0)
    if (weightDiff !== 0) return weightDiff
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

// 是否可以确认
const canConfirm = computed(() => {
  return selectedEnterpriseId.value && cpu.value > 0 && memory.value > 0
})

// 获取资源类型标签
function getResourceTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    3: '数据资源',
    2: '模型资源',
    1: '算力资源',
    0: '其他'
  }
  return labels[type] || '未知'
}

// 选择企业
function onSelectEnterprise(id: string) {
  selectedEnterpriseId.value = id
}

// 确认
function onConfirm() {
  if (!canConfirm.value) return

  const config: ResourceConfig = {
    participantId: selectedEnterpriseId.value,
    cpu: cpu.value,
    memory: memory.value,
    gpu: useGPU.value ? gpu.value : undefined,
    gpuType: useGPU.value ? gpuType.value : undefined
  }

  emit('confirm', config)
  emit('update:visible', false)
}

// 取消
function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}

// 重置状态
function reset() {
  selectedEnterpriseId.value = ''
  cpu.value = 8
  memory.value = 16
  useGPU.value = false
  gpu.value = 1
  gpuType.value = ''
}

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  if (visible) {
    reset()
    // 如果有初始配置，恢复配置
    if (props.initialConfig) {
      selectedEnterpriseId.value = props.initialConfig.participantId
      cpu.value = props.initialConfig.cpu
      memory.value = props.initialConfig.memory
      if (props.initialConfig.gpu) {
        useGPU.value = true
        gpu.value = props.initialConfig.gpu
        gpuType.value = props.initialConfig.gpuType || ''
      }
    }
    // 如果只有一个企业，自动选中
    if (sortedEnterprises.value.length === 1) {
      selectedEnterpriseId.value = sortedEnterprises.value[0]?.id || ''
    }
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
  max-width: 560px;
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

.config-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #FA8C16, #D46B08);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.enterprise-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.enterprise-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: var(--button-transition);
  background: var(--info-card-bg);

  &.selected {
    border-color: #FA8C16;
    background: rgba(250, 140, 22, 0.05);
  }

  &:hover {
    border-color: rgba(250, 140, 22, 0.3);
    background: var(--list-item-hover-bg);
  }
}

.enterprise-radio {
  input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: #FA8C16;
    cursor: pointer;
  }
}

.enterprise-info {
  flex: 1;
}

.enterprise-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.enterprise-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.resource-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #FA8C16;
    cursor: pointer;
  }
}

.config-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: white;
  transition: var(--button-transition);

  &:focus {
    outline: none;
    border-color: #FA8C16;
    box-shadow: 0 0 0 3px rgba(250, 140, 22, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
}

.config-unit {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.config-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: white;
  transition: var(--button-transition);

  &:focus {
    outline: none;
    border-color: #FA8C16;
    box-shadow: 0 0 0 3px rgba(250, 140, 22, 0.1);
  }
}

.config-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: white;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);

  &:hover {
    border-color: #FA8C16;
    color: #FA8C16;
  }

  &.active {
    background: linear-gradient(135deg, #FA8C16, #D46B08);
    border-color: #FA8C16;
    color: white;
  }
}

.gpu-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(250, 140, 22, 0.05);
  border: 1px solid rgba(250, 140, 22, 0.2);
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-item {
  font-size: 12px;
  padding: 4px 10px;
  background: rgba(250, 140, 22, 0.1);
  color: #D46B08;
  border-radius: 4px;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
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
  background: linear-gradient(135deg, #FA8C16, #D46B08);
  color: white;
  box-shadow: 0 2px 8px rgba(250, 140, 22, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(250, 140, 22, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
