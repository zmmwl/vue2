<template>
  <div
    v-if="modelValue"
    class="asset-selector-dialog-overlay"
    @click.self="handleCancel"
  >
    <div class="asset-selector-dialog">
      <!-- 头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">选择数据资产</h3>
        <button class="dialog-close" @click="handleCancel" aria-label="关闭">
          <span>&times;</span>
        </button>
      </div>

      <!-- 步骤指示器 -->
      <div class="step-indicators">
        <div
          v-for="(step, index) in steps"
          :key="index"
          :class="[
            'step-indicator',
            {
              'is-current': currentStep === index,
              'is-completed': currentStep > index
            }
          ]"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step }}</div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="dialog-content">
        <!-- 步骤 1: 选择企业 -->
        <div v-show="currentStep === 0" class="step-content">
          <div class="search-box">
            <input
              v-model="enterpriseSearch"
              type="text"
              placeholder="搜索企业名称"
              @input="onEnterpriseSearch"
            />
          </div>
          <div class="list-container">
            <div
              v-for="enterprise in filteredEnterprises"
              :key="enterprise.participantId"
              :class="['list-item', { 'is-selected': selectedEnterprise?.participantId === enterprise.participantId }]"
              @click="selectEnterprise(enterprise)"
            >
              <div class="item-name">{{ enterprise.entityName }}</div>
              <div class="item-id">{{ enterprise.participantId }}</div>
              <div class="item-count">{{ enterprise.enterpriseAssetList.length }} 个资产</div>
            </div>
            <div v-if="filteredEnterprises.length === 0" class="empty-state">
              <p>暂无可用企业</p>
            </div>
          </div>
        </div>

        <!-- 步骤 2: 选择数据资产 -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="search-box">
            <input
              v-model="assetSearch"
              type="text"
              placeholder="搜索数据资产名称"
              @input="onAssetSearch"
            />
          </div>
          <div class="list-container">
            <div
              v-for="asset in filteredAssets"
              :key="asset.assetId"
              :class="['list-item', { 'is-selected': selectedAsset?.assetId === asset.assetId }]"
              @click="selectAsset(asset)"
            >
              <div class="item-name">{{ asset.assetName }}</div>
              <div class="item-desc">{{ asset.intro || asset.assetEnName || '-' }}</div>
            </div>
            <div v-if="filteredAssets.length === 0" class="empty-state">
              <p>该企业暂无数据资产</p>
            </div>
          </div>
        </div>

        <!-- 步骤 3: 选择字段 -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="search-box">
            <input
              v-model="fieldSearch"
              type="text"
              placeholder="搜索字段名称"
              @input="onFieldSearch"
            />
          </div>
          <div class="fields-container">
            <div v-if="loading" class="loading-state">
              <p>加载中...</p>
            </div>
            <div v-else-if="filteredFields.length > 0" class="field-list">
              <div
                v-for="field in filteredFields"
                :key="field.name"
                :class="['field-item', { 'is-selected': selectedFields.has(field.name) }]"
                @click="toggleField(field)"
              >
                <input
                  type="checkbox"
                  :checked="selectedFields.has(field.name)"
                  @click.stop="toggleField(field)"
                />
                <div class="field-name">{{ field.name }}</div>
                <div class="field-type">{{ field.dataType }}</div>
                <div class="field-desc">{{ field.description || '-' }}</div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>该数据资产暂无可用字段</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <button
          v-if="currentStep > 0"
          class="btn btn-default"
          @click="handlePrevious"
        >
          上一步
        </button>
        <button
          class="btn btn-default"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          v-if="currentStep < 2"
          class="btn btn-primary"
          :disabled="!canNext"
          @click="handleNext"
        >
          下一步
        </button>
        <button
          v-else
          class="btn btn-primary"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Enterprise, AssetInfo, FieldInfo } from '@/types/nodes'
import { assetApi } from '@/services/assetApi'
import { logger } from '@/utils/logger'

interface Props {
  modelValue: boolean
  nodeId?: string          // 编辑模式下的节点 ID
  initialAssetInfo?: AssetInfo    // 编辑模式下的初始资产信息（用于回显）
  initialSelectedFields?: string[] // 编辑模式下的初始已选字段（用于回显）
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { assetInfo: AssetInfo; selectedFields: FieldInfo[] }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 步骤定义
const steps = ['选择企业', '选择数据资产', '选择字段']
const currentStep = ref(0)

// 数据状态
const enterprises = ref<Enterprise[]>([])
const selectedEnterprise = ref<Enterprise | null>(null)
const selectedAsset = ref<AssetInfo | null>(null)
const selectedFields = ref<Set<string>>(new Set())
const allFields = ref<FieldInfo[]>([])

// 搜索状态
const enterpriseSearch = ref('')
const assetSearch = ref('')
const fieldSearch = ref('')

// 加载状态
const loading = ref(false)

// 编辑模式状态
const isEditMode = computed(() => !!props.nodeId)

// 过滤后的企业列表
const filteredEnterprises = computed(() => {
  if (!enterpriseSearch.value) {
    return enterprises.value
  }
  const query = enterpriseSearch.value.toLowerCase()
  return enterprises.value.filter(e => e.entityName.toLowerCase().includes(query))
})

// 过滤后的资产列表
const filteredAssets = computed(() => {
  if (!selectedEnterprise.value) return []

  const assets = selectedEnterprise.value.enterpriseAssetList.map(asset => ({
    ...asset,
    scale: '1000万条',
    cycle: '每日'
  }))

  if (!assetSearch.value) {
    return assets
  }
  const query = assetSearch.value.toLowerCase()
  return assets.filter(a => a.assetName.toLowerCase().includes(query))
})

// 过滤后的字段列表
const filteredFields = computed(() => {
  if (!fieldSearch.value) {
    return allFields.value
  }
  const query = fieldSearch.value.toLowerCase()
  return allFields.value.filter(f => f.name.toLowerCase().includes(query))
})

// 导航状态
const canNext = computed(() => {
  if (currentStep.value === 0) return !!selectedEnterprise.value
  if (currentStep.value === 1) return !!selectedAsset.value
  return false
})

const canConfirm = computed(() => {
  return selectedFields.value.size > 0
})

// 加载企业列表
async function loadEnterprises() {
  try {
    logger.info('[AssetSelectorDialog] Loading enterprises')
    enterprises.value = await assetApi.getEnterpriseList()
    logger.info('[AssetSelectorDialog] Enterprises loaded', { count: enterprises.value.length })
  } catch (error: any) {
    logger.error('[AssetSelectorDialog] Failed to load enterprises', error)
    // TODO: 显示错误提示
  }
}

// 选择企业
function selectEnterprise(enterprise: Enterprise) {
  selectedEnterprise.value = enterprise
  selectedAsset.value = null
  selectedFields.value.clear()
  allFields.value = []
  logger.debug('[AssetSelectorDialog] Enterprise selected', { name: enterprise.entityName })
}

// 选择资产
async function selectAsset(asset: any) {
  // 从缓存或 API 获取完整资产信息
  try {
    logger.info('[AssetSelectorDialog] Loading asset details', { assetId: asset.assetId })

    // TODO: 使用缓存
    // const cached = assetCache.get(asset.assetId)
    // if (cached) { ... }

    const assetInfo = await assetApi.getAsset({ assetId: asset.assetId })
    selectedAsset.value = assetInfo
    allFields.value = assetInfo.dataInfo.fieldList

    // 默认选中所有字段
    selectedFields.value.clear()
    allFields.value.forEach(field => {
      selectedFields.value.add(field.name)
    })

    logger.info('[AssetSelectorDialog] Asset details loaded', {
      assetId: assetInfo.assetId,
      fieldCount: allFields.value.length,
      selectedCount: selectedFields.value.size
    })
  } catch (error: any) {
    logger.error('[AssetSelectorDialog] Failed to load asset details', error)
    // TODO: 显示错误提示
  }
}

// 切换字段选择
function toggleField(field: FieldInfo) {
  if (selectedFields.value.has(field.name)) {
    selectedFields.value.delete(field.name)
  } else {
    selectedFields.value.add(field.name)
  }
  logger.debug('[AssetSelectorDialog] Field toggled', { name: field.name, selected: selectedFields.value.has(field.name) })
}

// 搜索处理（防抖）
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onEnterpriseSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    logger.debug('[AssetSelectorDialog] Enterprise search', { query: enterpriseSearch.value })
  }, 300)
}

function onAssetSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    logger.debug('[AssetSelectorDialog] Asset search', { query: assetSearch.value })
  }, 300)
}

function onFieldSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    logger.debug('[AssetSelectorDialog] Field search', { query: fieldSearch.value })
  }, 300)
}

// 导航处理
function handlePrevious() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function handleNext() {
  if (currentStep.value < 2 && canNext.value) {
    currentStep.value++
  }
}

// 确认
function handleConfirm() {
  if (!selectedAsset.value || selectedFields.value.size === 0) {
    return
  }

  const selectedFieldList = allFields.value.filter(f => selectedFields.value.has(f.name))

  logger.info('[AssetSelectorDialog] Selection confirmed', {
    assetId: selectedAsset.value.assetId,
    assetName: selectedAsset.value.assetName,
    fieldCount: selectedFieldList.length
  })

  emit('confirm', {
    assetInfo: selectedAsset.value,
    selectedFields: selectedFieldList
  })

  closeDialog()
}

// 取消
function handleCancel() {
  logger.info('[AssetSelectorDialog] Cancelled')
  emit('cancel')
  closeDialog()
}

// 关闭对话框
function closeDialog() {
  emit('update:modelValue', false)
  resetState()
}

// 重置状态
function resetState() {
  currentStep.value = 0
  selectedEnterprise.value = null
  selectedAsset.value = null
  selectedFields.value.clear()
  allFields.value = []
  enterpriseSearch.value = ''
  assetSearch.value = ''
  fieldSearch.value = ''
}

// 键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter') {
    if (currentStep.value < 2 && canNext.value) {
      handleNext()
    } else if (currentStep.value === 2 && canConfirm.value) {
      handleConfirm()
    }
  }
}

// 生命周期
onMounted(() => {
  logger.info('[AssetSelectorDialog] Mounted', { isEditMode: isEditMode.value })
  loadEnterprises()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
  document.removeEventListener('keydown', handleKeydown)
})

// 监听对话框打开
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    loadEnterprises()

    // 编辑模式：回显当前选择
    if (props.nodeId && props.initialAssetInfo) {
      logger.info('[AssetSelectorDialog] Edit mode, restoring selection', {
        nodeId: props.nodeId,
        assetId: props.initialAssetInfo.assetId
      })

      // 回显资产信息
      selectedAsset.value = props.initialAssetInfo
      allFields.value = props.initialAssetInfo.dataInfo.fieldList || []

      // 回显已选字段（如果没有初始选择，默认选中所有字段）
      const initialFields = props.initialSelectedFields || []
      if (initialFields.length > 0) {
        selectedFields.value = new Set(initialFields)
      } else {
        // 默认选中所有字段
        selectedFields.value = new Set(allFields.value.map(f => f.name))
      }

      // 设置企业（通过 participantId 查找）
      await loadEnterprises()
      const enterprise = enterprises.value.find(
        e => e.participantId === props.initialAssetInfo?.participantId
      )
      if (enterprise) {
        selectedEnterprise.value = enterprise
      }

      // 跳转到字段选择步骤
      currentStep.value = 2
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

// 进入动画
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.asset-selector-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--transition-base) var(--easing-smooth);
}

.asset-selector-dialog {
  width: var(--dialog-width);
  max-width: var(--dialog-max-width);
  max-height: 85vh;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--dialog-border-radius);
  box-shadow: var(--shadow-dialog-overlay);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp var(--transition-slow) var(--easing-bounce);
  transform-origin: center center;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--dialog-header-padding);
  background: linear-gradient(135deg,
    rgba(14, 165, 233, 0.05) 0%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 1) 100%
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--datasource-blue) 50%,
      transparent 100%
    );
    opacity: 0.3;
  }
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}

.dialog-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg-light);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--button-sm-radius);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--button-transition);
  font-size: 20px;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #EF4444;
    transform: rotate(90deg);
  }

  &:active {
    transform: rotate(90deg) scale(0.95);
  }
}

.step-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 32px;
  gap: var(--step-indicator-spacing);
  background: var(--glass-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: calc(100% + 8px);
    width: var(--step-indicator-spacing);
    height: var(--step-line-height);
    background: var(--step-line-color);
    transform: translateY(-50%);
    z-index: 0;
    transition: background var(--transition-base) var(--easing-smooth);
  }

  &:last-child::before {
    display: none;
  }

  &.is-completed::before {
    background: linear-gradient(90deg,
      var(--step-line-active) 0%,
      rgba(14, 165, 233, 0.3) 100%
    );
  }

  &.is-current::before {
    background: linear-gradient(90deg,
      var(--step-line-active) 0%,
      var(--step-line-color) 100%
    );
  }
}

.step-number {
  width: var(--step-indicator-size);
  height: var(--step-indicator-size);
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  position: relative;
  z-index: 1;
  border: 2px solid var(--glass-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all var(--transition-base) var(--easing-smooth);

  .step-indicator.is-completed & {
    background: linear-gradient(135deg, #52C41A, #389E0D);
    color: white;
    border-color: #52C41A;
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);

    &::after {
      content: '✓';
      font-size: 14px;
    }
  }

  .step-indicator.is-current & {
    background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
    color: white;
    border-color: var(--datasource-blue);
    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.4);
    transform: scale(1.1);
  }
}

.step-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color var(--transition-base) var(--easing-smooth);

  .step-indicator.is-current & {
    color: var(--datasource-blue);
    font-weight: 600;
  }

  .step-indicator.is-completed & {
    color: #52C41A;
  }
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-box {
  padding: 16px 24px;
  background: var(--glass-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  input {
    width: 100%;
    height: var(--input-height);
    padding: 0 40px 0 var(--input-padding);
    background: var(--input-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--input-border);
    border-radius: var(--input-radius);
    font-size: 14px;
    color: var(--text-primary);
    transition: all var(--transition-base) var(--easing-smooth);

    &:focus {
      outline: none;
      border-color: var(--input-border-focus);
      box-shadow: var(--input-shadow-focus);
      background-color: white;
    }

    &::placeholder {
      color: var(--text-disabled);
    }

    &:hover {
      border-color: rgba(14, 165, 233, 0.3);
    }
  }
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--glass-bg);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  }
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--list-item-padding);
  margin-bottom: var(--list-item-gap);
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--list-item-radius);
  cursor: pointer;
  transition: all var(--transition-base) var(--easing-smooth);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--datasource-blue);
    transform: scaleY(0);
    transition: transform var(--transition-base) var(--easing-smooth);
  }

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: var(--list-item-selected-border);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);

    &::before {
      transform: scaleY(1);
    }
  }

  &.is-selected {
    background: var(--list-item-selected-bg);
    border-color: var(--datasource-blue);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);

    &::before {
      transform: scaleY(1);
    }

    .item-name {
      color: var(--datasource-blue);
      font-weight: 600;
    }
  }
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color var(--transition-base) var(--easing-smooth);
}

.item-id {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 12px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: var(--field-tag-radius);
  font-weight: 500;
}

.fields-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--glass-bg);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: var(--list-item-gap);
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--list-item-padding);
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--list-item-radius);
  cursor: pointer;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: rgba(14, 165, 233, 0.2);
  }

  &.is-selected {
    background: var(--list-item-selected-bg);
    border-color: var(--datasource-blue);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);

    .field-name {
      color: var(--datasource-blue);
      font-weight: 600;
    }
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid var(--border-color);
    cursor: pointer;
    appearance: none;
    position: relative;
    transition: all var(--transition-base) var(--easing-smooth);
    flex-shrink: 0;

    &:checked {
      background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
      border-color: var(--datasource-blue);

      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: 700;
      }
    }

    &:hover {
      border-color: var(--datasource-blue);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
  }
}

.field-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color var(--transition-base) var(--easing-smooth);
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.field-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 12px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.empty-state p,
.loading-state p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: var(--dialog-footer-padding);
  background: var(--glass-bg);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn {
  padding: var(--button-md-padding);
  border-radius: var(--button-md-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.btn-default {
  background: var(--glass-bg);
  border-color: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);

  &:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--datasource-blue);
    color: var(--datasource-blue);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0284C7, #0369A1);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
    transform: translateY(-1px);
  }
}
</style>
