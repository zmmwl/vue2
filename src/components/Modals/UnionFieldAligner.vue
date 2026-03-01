<template>
  <div class="union-field-aligner">
    <!-- 模式选择器 -->
    <div class="mode-selector">
      <label class="mode-label">字段对齐模式：</label>
      <div class="mode-buttons">
        <button
          v-for="mode in alignmentModes"
          :key="mode.value"
          :class="['mode-btn', { active: currentMode === mode.value }]"
          @click="currentMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
      <span class="mode-hint">{{ currentModeHint }}</span>
    </div>

    <!-- 模式内容区域 -->
    <div class="mode-content">
      <TableMode
        v-if="currentMode === 'table'"
        :providers="providers"
        :field-mappings="fieldMappings"
        @update:mappings="handleMappingsUpdate"
      />
      <ColumnAlignMode
        v-else-if="currentMode === 'column'"
        :providers="providers"
        :field-mappings="fieldMappings"
        @update:mappings="handleMappingsUpdate"
      />
      <FieldMappingMode
        v-else-if="currentMode === 'field'"
        :providers="providers"
        :field-mappings="fieldMappings"
        @update:mappings="handleMappingsUpdate"
      />
    </div>

    <!-- 实时预览 -->
    <div class="preview-section">
      <div class="preview-header">
        <span class="preview-title">预览对齐后的字段结构</span>
        <span v-if="isUpdating" class="updating-indicator">更新中...</span>
      </div>
      <div class="preview-content">
        <div v-if="previewFields.length === 0" class="preview-empty">
          请配置字段映射
        </div>
        <div v-else class="preview-fields">
          <div
            v-for="(field, index) in previewFields"
            :key="index"
            class="preview-field"
          >
            <span class="field-index">{{ index + 1 }}</span>
            <span class="field-name">{{ field.targetAlias }}</span>
            <span class="field-type">{{ field.targetType }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { InputProvider, UnionFieldMapping } from '@/types/nodes'
import TableMode from './union-align/TableMode.vue'
import ColumnAlignMode from './union-align/ColumnAlignMode.vue'
import FieldMappingMode from './union-align/FieldMappingMode.vue'

// Props
interface Props {
  providers: InputProvider[]
  fieldMappings?: UnionFieldMapping[]
}

const props = withDefaults(defineProps<Props>(), {
  fieldMappings: () => []
})

// Emits
const emit = defineEmits<{
  'update:mappings': [mappings: UnionFieldMapping[]]
}>()

// 对齐模式类型
type AlignmentMode = 'table' | 'column' | 'field'

// 对齐模式选项
const alignmentModes = [
  { value: 'table' as AlignmentMode, label: '表格模式', hint: '最简单易用，在表格中填写统一别名' },
  { value: 'column' as AlignmentMode, label: '列对齐模式', hint: '拖拽各数据源的列来对齐' },
  { value: 'field' as AlignmentMode, label: '逐字段映射', hint: '创建目标字段，选择对应源字段' }
]

// 当前模式（默认表格模式）
const currentMode = ref<AlignmentMode>('table')

// 当前模式提示
const currentModeHint = computed(() => {
  const mode = alignmentModes.find(m => m.value === currentMode.value)
  return mode?.hint || ''
})

// 内部字段映射
const internalMappings = ref<UnionFieldMapping[]>([...props.fieldMappings])

// 更新状态
const isUpdating = ref(false)

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// 处理映射更新（带防抖）
function handleMappingsUpdate(mappings: UnionFieldMapping[]) {
  internalMappings.value = mappings

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 显示更新状态
  isUpdating.value = true

  // 200ms 防抖后更新预览
  debounceTimer = setTimeout(() => {
    emit('update:mappings', mappings)
    isUpdating.value = false
  }, 200)
}

// 预览字段
const previewFields = computed(() => {
  return internalMappings.value
    .filter(m => m.targetAlias)
    .sort((a, b) => a.order - b.order)
})

// 监听外部映射变化
watch(() => props.fieldMappings, (newMappings) => {
  internalMappings.value = [...newMappings]
}, { deep: true })
</script>

<style scoped lang="scss">
.union-field-aligner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-label {
  font-weight: 500;
  color: #333;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  &.active {
    background: #1890ff;
    border-color: #1890ff;
    color: #fff;
  }
}

.mode-hint {
  color: #8c8c8c;
  font-size: 12px;
}

.mode-content {
  min-height: 200px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.preview-section {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
}

.preview-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.updating-indicator {
  color: #1890ff;
  font-size: 12px;
}

.preview-content {
  padding: 12px 16px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-empty {
  color: #8c8c8c;
  text-align: center;
  padding: 20px;
}

.preview-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 4px;
}

.field-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
}

.field-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.field-type {
  color: #8c8c8c;
  font-size: 12px;
}
</style>
