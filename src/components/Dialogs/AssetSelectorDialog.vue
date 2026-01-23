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
    selectedFields.value.clear()

    logger.info('[AssetSelectorDialog] Asset details loaded', {
      assetId: assetInfo.assetId,
      fieldCount: allFields.value.length
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

      // 回显已选字段
      selectedFields.value = new Set(props.initialSelectedFields || [])

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

.asset-selector-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.asset-selector-dialog {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  width: 600px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-hover);
  }
}

.step-indicators {
  display: flex;
  justify-content: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;

  &:not(:last-child)::after {
    content: '';
    width: 40px;
    height: 1px;
    background: var(--border-color);
  }

  &.is-completed .step-number {
    background: $step-indicator-completed-bg;
    color: $step-indicator-completed-text;
  }

  &.is-current .step-number {
    background: $step-indicator-current-bg;
    color: $step-indicator-current-text;
  }
}

.step-number {
  width: $step-indicator-size;
  height: $step-indicator-size;
  border-radius: 50%;
  background: $step-indicator-pending-bg;
  color: $step-indicator-pending-text;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.step-label {
  font-size: 12px;
  color: var(--text-secondary);
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
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);

  input {
    width: 100%;
    height: $search-box-height;
    padding: 0 12px;
    border: 1px solid $search-box-border;
    border-radius: var(--radius-sm);
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: $search-box-focus-border;
    }

    &::placeholder {
      color: $search-box-placeholder;
    }
  }
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: $list-item-hover-bg;
  }

  &.is-selected {
    background: $list-item-selected-bg;
  }
}

.item-name {
  font-size: 14px;
  color: var(--text-primary);
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 12px;
}

.item-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.fields-container {
  flex: 1;
  overflow-y: auto;
}

.field-list {
  padding: 8px 0;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: $field-item-hover-bg;
  }

  &.is-selected {
    background: $field-item-selected-bg;
  }

  input[type="checkbox"] {
    margin-right: 12px;
    width: $field-item-checkbox-size;
    height: $field-item-checkbox-size;
    cursor: pointer;
  }
}

.field-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.field-type {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 12px;
}

.field-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 12px;
  flex: 1;
  text-align: right;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.empty-state p,
.loading-state p {
  margin: 0;
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:disabled {
    background: $button-disabled-bg;
    color: $button-disabled-text;
    cursor: not-allowed;
    border-color: transparent;
  }
}

.btn-default {
  background: white;
  border-color: $button-default-border;
  color: var(--text-primary);

  &:hover:not(:disabled) {
    border-color: $button-default-hover;
    color: $button-default-hover;
  }
}

.btn-primary {
  background: $button-primary-bg;
  color: white;

  &:hover:not(:disabled) {
    background: $button-primary-hover;
  }
}
</style>
