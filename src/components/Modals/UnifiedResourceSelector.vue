<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container unified-resource-selector" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">{{ dialogTitle }}</h3>
            <button class="modal-close" @click="handleCancel" aria-label="关闭">
              <span>&times;</span>
            </button>
          </div>

          <!-- 步骤指示器 -->
          <div v-if="props.resourceType === 'data'" class="step-indicators">
            <div
              :class="['step-indicator', { 'is-current': currentStep === 0, 'is-completed': currentStep > 0 }]"
            >
              <div class="step-number">{{ currentStep > 0 ? '✓' : '1' }}</div>
              <div class="step-label">选择资产</div>
            </div>
            <div class="step-connector"></div>
            <div
              :class="['step-indicator', { 'is-current': currentStep === 1 }]"
            >
              <div class="step-number">2</div>
              <div class="step-label">选择字段</div>
            </div>
          </div>

          <!-- 第一步：资源选择 -->
          <div v-show="currentStep === 0" class="step-content">
            <!-- 双搜索框 -->
            <div class="search-section">
              <div class="search-boxes">
                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input
                    v-model="resourceNameQuery"
                    type="text"
                    :placeholder="resourceNamePlaceholder"
                    @input="onSearch"
                  />
                  <button
                    v-if="resourceNameQuery"
                    class="search-clear"
                    @click="clearResourceNameSearch"
                    aria-label="清除搜索"
                  >
                    &times;
                  </button>
                </div>
                <div class="search-box">
                  <span class="search-icon">🏢</span>
                  <input
                    v-model="companyNameQuery"
                    type="text"
                    placeholder="搜索企业名称..."
                    @input="onSearch"
                  />
                  <button
                    v-if="companyNameQuery"
                    class="search-clear"
                    @click="clearCompanyNameSearch"
                    aria-label="清除搜索"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- 资源列表 -->
            <div class="modal-body">
              <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
              </div>

              <div v-else-if="filteredResources.length === 0" class="empty-state">
                <div class="empty-icon">{{ emptyStateIcon }}</div>
                <p class="empty-text">{{ emptyStateText }}</p>
                <p v-if="hasActiveFilters" class="empty-hint">请调整筛选条件</p>
              </div>

              <div v-else class="resource-list">
                <div
                  v-for="resource in filteredResources"
                  :key="resource.id"
                  :class="['resource-item', { 'is-selected': selectedResourceId === resource.id }]"
                  @click="selectResource(resource)"
                >
                  <div class="resource-icon">{{ resourceIcon }}</div>
                  <div class="resource-info">
                    <div class="resource-name">{{ resource.name }}</div>
                    <div class="resource-company">{{ resource.participantName }}</div>
                    <div class="resource-type">{{ resource.type }}</div>
                  </div>
                  <div v-if="selectedResourceId === resource.id" class="check-icon">✓</div>
                </div>
              </div>
            </div>

            <!-- 第一步底部按钮 -->
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="handleCancel">取消</button>
              <button
                class="btn btn-primary"
                :disabled="!selectedResource || (props.resourceType === 'data' && false)"
                @click="goToNextStep"
              >
                {{ props.resourceType === 'data' ? '下一步' : '确认' }}
              </button>
            </div>
          </div>

          <!-- 第二步：字段选择（仅数据源类型） -->
          <div v-show="currentStep === 1" class="step-content">
            <!-- 已选资源信息 -->
            <div class="selected-resource-info">
              <div class="info-label">已选资产：</div>
              <div class="info-value">
                {{ selectedResource?.name }}
                <span class="info-company">（{{ selectedResource?.participantName }}）</span>
              </div>
            </div>

            <!-- 字段选择区域 -->
            <div class="modal-body field-selection-body">
              <div v-if="loadingFields" class="loading-state">
                <div class="loading-spinner"></div>
                <p>加载字段中...</p>
              </div>

              <div v-else class="field-section">
                <div class="field-section-header">
                  <h4>选择字段</h4>
                  <div class="field-actions">
                    <button class="field-action-btn" @click="selectAllFields">全选</button>
                    <button class="field-action-btn" @click="clearAllFields">清空</button>
                  </div>
                </div>
                <div class="field-list">
                  <div
                    v-for="field in availableFields"
                    :key="field.name"
                    :class="['field-item', { 'is-selected': selectedFields.has(field.name) }]"
                    @click="toggleField(field)"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedFields.has(field.name)"
                      @click.stop="toggleField(field)"
                    />
                    <div class="field-name">
                      <span v-if="field.isPrimaryKey" class="primary-key-badge">🔑</span>
                      {{ field.name }}
                    </div>
                    <div class="field-type">{{ field.dataType }}</div>
                    <div v-if="field.description" class="field-desc">{{ field.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 第二步底部按钮 -->
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="goToPreviousStep">上一步</button>
              <button class="btn btn-secondary" @click="handleCancel">取消</button>
              <button
                class="btn btn-primary"
                :disabled="selectedFields.size === 0"
                @click="handleConfirm"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ResourceSelectionResult } from '@/types/nodes'
import type { FieldInfo } from '@/types/nodes'
import { assetApi } from '@/services/assetApi'
import { getEnterprisesByResourceType } from '@/services/enterpriseService'
import { getMockModels, getMockComputeResources } from '@/utils/mock-data'
import { logger } from '@/utils/logger'

interface ResourceItem {
  id: string
  name: string
  participantId: string
  participantName: string
  type: string
}

interface Props {
  modelValue: boolean
  resourceType: 'data' | 'model' | 'compute'
  modelTypeFilter?: string
  initialSelection?: any
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', selection: ResourceSelectionResult): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 状态
const loading = ref(false)
const loadingFields = ref(false)
const currentStep = ref(0)
const resourceNameQuery = ref('')
const companyNameQuery = ref('')
const allResources = ref<ResourceItem[]>([])
const selectedResourceId = ref<string>()
const selectedResource = ref<ResourceItem>()
const availableFields = ref<FieldInfo[]>([])
const selectedFields = ref<Set<string>>(new Set())

// 计算属性
const dialogTitle = computed(() => {
  switch (props.resourceType) {
    case 'data': return '选择数据资产'
    case 'model': return '选择计算模型'
    case 'compute': return '选择算力资源'
  }
})

const resourceNamePlaceholder = computed(() => {
  switch (props.resourceType) {
    case 'data': return '搜索资产名称...'
    case 'model': return '搜索模型名称...'
    case 'compute': return '搜索算力名称...'
  }
})

const resourceIcon = computed(() => {
  switch (props.resourceType) {
    case 'data': return '📄'
    case 'model': return '📦'
    case 'compute': return '⚡'
  }
})

const emptyStateIcon = computed(() => {
  switch (props.resourceType) {
    case 'data': return '📄'
    case 'model': return '📦'
    case 'compute': return '⚡'
  }
})

const emptyStateText = computed(() => {
  if (hasActiveFilters.value) return '未找到匹配的资源'
  switch (props.resourceType) {
    case 'data': return '暂无可用数据资产'
    case 'model': return '暂无可用模型'
    case 'compute': return '暂无可用算力资源'
  }
})

const hasActiveFilters = computed(() => {
  return resourceNameQuery.value.trim() !== '' || companyNameQuery.value.trim() !== ''
})

const filteredResources = computed(() => {
  return allResources.value.filter(resource => {
    const matchName = !resourceNameQuery.value.trim() ||
      resource.name.toLowerCase().includes(resourceNameQuery.value.toLowerCase())
    const matchCompany = !companyNameQuery.value.trim() ||
      resource.participantName.toLowerCase().includes(companyNameQuery.value.toLowerCase())
    return matchName && matchCompany
  })
})

// 加载资源数据
async function loadResources() {
  loading.value = true
  try {
    if (props.resourceType === 'data') {
      await loadDataResources()
    } else if (props.resourceType === 'model') {
      await loadModelResources()
    } else if (props.resourceType === 'compute') {
      await loadComputeResources()
    }
  } catch (error) {
    logger.error('[UnifiedResourceSelector] Failed to load resources', error)
  } finally {
    loading.value = false
  }
}

async function loadDataResources() {
  logger.info('[UnifiedResourceSelector] Loading data resources')
  const enterprises = await assetApi.getEnterpriseList()
  allResources.value = enterprises.flatMap(ent =>
    ent.enterpriseAssetList.map(asset => ({
      id: asset.assetId,
      name: asset.assetName,
      participantId: ent.participantId,
      participantName: ent.entityName,
      type: '数据资产'
    }))
  )
  logger.info('[UnifiedResourceSelector] Data resources loaded', { count: allResources.value.length })
}

async function loadModelResources() {
  logger.info('[UnifiedResourceSelector] Loading model resources')
  const enterprises = await getEnterprisesByResourceType('model')
  const models: ResourceItem[] = []

  for (const ent of enterprises) {
    const mockModels = getMockModels(ent.participantId)
    for (const model of mockModels) {
      if (props.modelTypeFilter && model.type !== props.modelTypeFilter) {
        continue
      }
      models.push({
        id: model.id,
        name: model.name,
        participantId: ent.participantId,
        participantName: ent.entityName,
        type: model.type
      })
    }
  }

  allResources.value = models
  logger.info('[UnifiedResourceSelector] Model resources loaded', { count: allResources.value.length })
}

async function loadComputeResources() {
  logger.info('[UnifiedResourceSelector] Loading compute resources')
  const enterprises = await getEnterprisesByResourceType('compute')
  const computes: ResourceItem[] = []

  for (const ent of enterprises) {
    const mockComputes = getMockComputeResources(ent.participantId)
    for (const compute of mockComputes) {
      computes.push({
        id: compute.id,
        name: `${compute.groupName} - ${compute.cardSerial}`,
        participantId: ent.participantId,
        participantName: ent.entityName,
        type: compute.type
      })
    }
  }

  allResources.value = computes
  logger.info('[UnifiedResourceSelector] Compute resources loaded', { count: allResources.value.length })
}

// 选择资源
function selectResource(resource: ResourceItem) {
  selectedResourceId.value = resource.id
  selectedResource.value = resource
}

// 进入下一步（加载数据源字段）
async function goToNextStep() {
  if (!selectedResource.value) return

  if (props.resourceType === 'data') {
    // 数据源：加载字段列表并进入第二步
    await loadFieldsForAsset(selectedResource.value.id)
    currentStep.value = 1
  } else {
    // 模型/算力：直接确认
    await handleConfirm()
  }
}

async function loadFieldsForAsset(assetId: string) {
  try {
    loadingFields.value = true
    const assetInfo = await assetApi.getAsset({ assetId })
    availableFields.value = assetInfo.dataInfo.fieldList

    // 默认选中所有字段
    selectedFields.value.clear()
    availableFields.value.forEach(field => {
      selectedFields.value.add(field.name)
    })

    logger.info('[UnifiedResourceSelector] Fields loaded', {
      assetId,
      fieldCount: availableFields.value.length,
      selectedCount: selectedFields.value.size
    })
  } catch (error) {
    logger.error('[UnifiedResourceSelector] Failed to load fields', error)
  } finally {
    loadingFields.value = false
  }
}

// 返回上一步
function goToPreviousStep() {
  currentStep.value = 0
}

// 字段操作
function toggleField(field: FieldInfo) {
  if (selectedFields.value.has(field.name)) {
    selectedFields.value.delete(field.name)
  } else {
    selectedFields.value.add(field.name)
  }
}

function selectAllFields() {
  availableFields.value.forEach(field => {
    selectedFields.value.add(field.name)
  })
}

function clearAllFields() {
  selectedFields.value.clear()
}

// 搜索
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    logger.debug('[UnifiedResourceSelector] Search', {
      resourceName: resourceNameQuery.value,
      companyName: companyNameQuery.value
    })
  }, 300)
}

function clearResourceNameSearch() {
  resourceNameQuery.value = ''
}

function clearCompanyNameSearch() {
  companyNameQuery.value = ''
}

// 确认
async function handleConfirm() {
  if (!selectedResource.value) return

  const resourceId = selectedResource.value.id
  const resourceParticipantId = selectedResource.value.participantId
  const resourceName = selectedResource.value.name
  const resourceParticipantName = selectedResource.value.participantName

  const result: ResourceSelectionResult = {}

  if (props.resourceType === 'data') {
    const assetInfo = await assetApi.getAsset({ assetId: resourceId })
    const selectedFieldList = availableFields.value.filter(f => selectedFields.value.has(f.name))

    result.assetInfo = assetInfo
    result.selectedFields = selectedFieldList
  } else if (props.resourceType === 'model') {
    result.modelInfo = {
      id: resourceId,
      name: resourceName,
      type: selectedResource.value.type,
      participantId: resourceParticipantId,
      entityName: resourceParticipantName
    }
  } else if (props.resourceType === 'compute') {
    // 获取完整的算力信息
    const enterprises = await getEnterprisesByResourceType('compute')
    for (const ent of enterprises) {
      if (ent.participantId === resourceParticipantId) {
        const mockComputes = getMockComputeResources(ent.participantId)
        const compute = mockComputes.find(c => c.id === resourceId)
        if (compute) {
          result.computeInfo = {
            id: compute.id,
            name: `${compute.groupName} - ${compute.cardSerial}`,
            type: compute.type,
            participantId: ent.participantId,
            entityName: ent.entityName,
            groupId: compute.groupId,
            groupName: compute.groupName,
            nodeId: compute.nodeId,
            cardSerial: compute.cardSerial,
            cardModel: compute.cardModel,
            cores: compute.cores
          }
          break
        }
      }
    }
  }

  logger.info('[UnifiedResourceSelector] Selection confirmed', result)
  emit('confirm', result)
  handleClose()
}

// 取消
function handleCancel() {
  logger.info('[UnifiedResourceSelector] Cancelled')
  emit('cancel')
  handleClose()
}

// 关闭
function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}

function handleClose() {
  emit('update:modelValue', false)
  resetState()
}

// 重置状态
function resetState() {
  currentStep.value = 0
  resourceNameQuery.value = ''
  companyNameQuery.value = ''
  selectedResourceId.value = undefined
  selectedResource.value = undefined
  availableFields.value = []
  selectedFields.value.clear()
  if (searchTimeout) clearTimeout(searchTimeout)
}

// 监听对话框打开
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await loadResources()
  }
})

// 键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleCancel()
  } else if (event.key === 'Enter') {
    if (currentStep.value === 0 && selectedResource.value) {
      goToNextStep()
    } else if (currentStep.value === 1 && selectedFields.value.size > 0) {
      handleConfirm()
    }
  }
}

// 组件挂载时添加键盘监听
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
// 统一淡蓝色配色方案 - 与现有对话框保持一致
$datasource-blue: #0EA5E9;
$datasource-blue-dark: #0284C7;
$datasource-blue-light: #38BDF8;
$success-color: #52C41A;
$success-light: #67D888;

$text-primary: #262626;
$text-secondary: #595959;
$text-muted: #8C8C8C;
$text-disabled: #BFBFBF;

$bg-primary: #ffffff;
$bg-secondary: #fafafa;
$bg-tertiary: #f5f5f5;
$bg-hover: #f0f0f0;

$border-color: #d9d9d9;
$border-light: #e8e8e8;

// 卡片阴影
$card-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.12);
$card-shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
$card-shadow-hover: 0 12px 24px rgba(14, 165, 233, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
$card-shadow-selected: 0 4px 16px rgba(14, 165, 233, 0.3);

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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  width: 680px;
  max-width: 90vw;
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
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
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

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-close {
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
}

// 步骤指示器
.step-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  gap: 24px;
  background: var(--glass-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;

  .step-indicator.is-current & {
    background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
    color: white;
    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.4);
    transform: scale(1.1);
  }

  .step-indicator.is-completed & {
    background: #52C41A;
    color: white;

    &::before {
      content: '✓';
      font-size: 16px;
    }
  }
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.3s;

  .step-indicator.is-current & {
    color: var(--datasource-blue);
  }

  .step-indicator.is-completed & {
    color: #52C41A;
  }
}

.step-connector {
  width: 48px;
  height: 2px;
  background: rgba(0, 0, 0, 0.08);
}

.step-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// 搜索区域
.search-section {
  padding: 16px 24px;
  background: var(--glass-bg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.search-boxes {
  display: flex;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;

  input {
    width: 100%;
    height: 40px;
    padding: 0 40px 0 40px;
    background: var(--input-bg);
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

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 16px;
  opacity: 0.5;
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 10px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.15);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--glass-bg);
  max-height: 400px;

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

.field-selection-body {
  max-height: 350px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(14, 165, 233, 0.1);
  border-top-color: var(--datasource-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-disabled);
}

// 资源列表
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--info-card-bg);
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
    box-shadow: var(--card-shadow-hover);

    &::before {
      transform: scaleY(1);
    }

    .resource-name {
      color: var(--datasource-blue);
    }
  }

  &.is-selected {
    background: var(--list-item-selected-bg);
    border-color: var(--datasource-blue);
    box-shadow: var(--card-shadow-selected);

    &::before {
      transform: scaleY(1);
    }

    .resource-name {
      color: var(--datasource-blue);
      font-weight: 600;
    }
  }
}

.resource-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.08));
  border-radius: 8px;
  font-size: 20px;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.resource-company {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.resource-type {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(14, 165, 233, 0.1);
  color: var(--datasource-blue);
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
}

.check-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #52c41a;
}

// 已选资源信息
.selected-resource-info {
  padding: 16px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-company {
  color: #6b7280;
  font-weight: 400;
  font-size: 13px;
}

// 字段选择
.field-section {
  padding: 16px 0;
}

.field-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.3px;
  }
}

.field-actions {
  display: flex;
  gap: 6px;
}

.field-action-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #111827;
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.field-item {
  display: grid;
  grid-template-columns: 20px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #0ea5e9;
    background: #fafbfc;
  }

  &.is-selected {
    background: #f0f9ff;
    border-color: #0ea5e9;

    .field-name {
      color: #0369a1;
    }

    .field-type {
      background: #e0f2fe;
      color: #0369a1;
    }
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1.5px solid #d1d5db;
    cursor: pointer;
    appearance: none;
    position: relative;
    transition: all 0.15s ease;
    flex-shrink: 0;
    background: white;

    &:checked {
      background: #0ea5e9;
      border-color: #0ea5e9;

      &::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 5px;
        width: 4px;
        height: 7px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }

    &:hover {
      border-color: #0ea5e9;
    }
  }
}

.field-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
}

.primary-key-badge {
  font-size: 11px;
  opacity: 0.7;
}

.field-type {
  font-size: 11px;
  color: #6b7280;
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Menlo', monospace;
  font-weight: 500;
  letter-spacing: 0.2px;
  transition: all 0.15s ease;
}

.field-desc {
  font-size: 12px;
  color: #9ca3af;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 底部按钮
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: var(--glass-bg);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.btn-secondary {
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
