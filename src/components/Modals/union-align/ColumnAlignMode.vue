<template>
  <div class="column-align-mode">
    <div class="mode-description">
      <span class="desc-icon">💡</span>
      <span>拖拽各数据源的字段来对齐，相同位置的字段将被合并为统一别名</span>
    </div>

    <div class="align-workspace">
      <!-- 目标列（统一别名） -->
      <div class="target-columns">
        <div class="column-header">统一别名</div>
        <div
          v-for="(mapping, index) in localMappings"
          :key="index"
          class="target-slot"
          :class="{ 'has-value': mapping.targetAlias }"
          @dragover.prevent
          @drop="handleDropOnTarget($event, index)"
        >
          <div v-if="mapping.targetAlias" class="slot-content">
            <span class="alias-name">{{ mapping.targetAlias }}</span>
            <button class="clear-btn" @click="clearMapping(index)">✕</button>
          </div>
          <div v-else class="slot-placeholder">
            拖拽字段到此处
          </div>
        </div>
      </div>

      <!-- 数据源列 -->
      <div class="source-columns">
        <div
          v-for="(provider, pIndex) in providers"
          :key="provider.participantId"
          class="provider-column"
        >
          <div class="column-header">
            {{ getProviderLabel(provider, pIndex) }}
          </div>
          <div class="source-fields">
            <div
              v-for="field in getProviderFields(provider)"
              :key="field.columnName"
              class="source-field"
              :class="{ 'used': isFieldUsed(provider.participantId, field.columnName) }"
              draggable="true"
              @dragstart="handleDragStart($event, provider.participantId, field.columnName, field.columnType)"
              @dragend="handleDragEnd"
            >
              <span class="field-name">{{ field.columnName }}</span>
              <span class="field-type">{{ field.columnType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="action-btn" @click="addTargetSlot">+ 添加目标字段</button>
      <button class="action-btn" @click="autoAlign">自动对齐相同名称</button>
      <button class="action-btn danger" @click="clearAll">清空所有</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { InputProvider, UnionFieldMapping, FieldMapping } from '@/types/nodes'

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

// 本地映射数据
const localMappings = ref<UnionFieldMapping[]>([])

// 拖拽状态
const dragState = ref<{
  participantId: string
  fieldName: string
  fieldType: string
} | null>(null)

// 初始化
onMounted(() => {
  if (props.fieldMappings.length > 0) {
    localMappings.value = props.fieldMappings.map(m => ({
      ...m,
      sourceFields: { ...m.sourceFields }
    }))
  } else {
    // 初始化一些空槽位
    for (let i = 0; i < 5; i++) {
      addTargetSlot()
    }
  }
})

// 监听外部映射变化
watch(() => props.fieldMappings, (newMappings) => {
  if (newMappings.length > 0) {
    localMappings.value = newMappings.map(m => ({
      ...m,
      sourceFields: { ...m.sourceFields }
    }))
  }
}, { deep: true })

// 获取数据源标签
function getProviderLabel(_provider: InputProvider, index: number): string {
  return `数据源 ${index + 1}`
}

// 获取数据源字段列表
function getProviderFields(provider: InputProvider): FieldMapping[] {
  return provider.fields
}

// 检查字段是否已使用
function isFieldUsed(participantId: string, fieldName: string): boolean {
  return localMappings.value.some(m =>
    m.sourceFields[participantId] === fieldName
  )
}

// 添加目标槽位
function addTargetSlot() {
  const sourceFields: Record<string, string | null> = {}
  props.providers.forEach(p => {
    sourceFields[p.participantId] = null
  })

  localMappings.value.push({
    targetAlias: '',
    targetType: 'STRING',
    order: localMappings.value.length,
    sourceFields
  })
}

// 清除映射
function clearMapping(index: number) {
  const sourceFields: Record<string, string | null> = {}
  props.providers.forEach(p => {
    sourceFields[p.participantId] = null
  })
  localMappings.value[index] = {
    targetAlias: '',
    targetType: 'STRING',
    order: index,
    sourceFields
  }
  emitChanges()
}

// 清空所有
function clearAll() {
  localMappings.value = []
  for (let i = 0; i < 5; i++) {
    addTargetSlot()
  }
  emitChanges()
}

// 自动对齐相同名称的字段
function autoAlign() {
  if (props.providers.length === 0) return

  // 收集所有字段名
  const allFieldNames = new Set<string>()
  props.providers.forEach(p => {
    getProviderFields(p).forEach(f => {
      allFieldNames.add(f.columnName)
    })
  })

  // 创建映射
  localMappings.value = []
  Array.from(allFieldNames).sort().forEach((fieldName, index) => {
    const sourceFields: Record<string, string | null> = {}
    let targetType = 'STRING'

    props.providers.forEach(p => {
      const field = getProviderFields(p).find(f => f.columnName === fieldName)
      if (field) {
        sourceFields[p.participantId] = fieldName
        targetType = field.columnType || 'STRING'
      } else {
        sourceFields[p.participantId] = null
      }
    })

    localMappings.value.push({
      targetAlias: fieldName,
      targetType,
      order: index,
      sourceFields
    })
  })

  emitChanges()
}

// 拖拽开始
function handleDragStart(
  event: DragEvent,
  participantId: string,
  fieldName: string,
  fieldType: string
) {
  dragState.value = { participantId, fieldName, fieldType }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', fieldName)
  }
}

// 拖拽结束
function handleDragEnd() {
  dragState.value = null
}

// 放置到目标
function handleDropOnTarget(_event: DragEvent, targetIndex: number) {
  if (!dragState.value) return

  const { participantId, fieldName, fieldType } = dragState.value

  // 确保目标槽位存在
  while (localMappings.value.length <= targetIndex) {
    addTargetSlot()
  }

  const mapping = localMappings.value[targetIndex]
  if (mapping) {
    mapping.sourceFields[participantId] = fieldName
    mapping.targetType = fieldType

    // 如果还没有别名，使用字段名作为默认别名
    if (!mapping.targetAlias) {
      mapping.targetAlias = fieldName
    }
  }

  emitChanges()
  dragState.value = null
}

// 发送变更
function emitChanges() {
  const mappings = localMappings.value
    .filter(m => Object.values(m.sourceFields).some(v => v !== null))
    .map((m, index) => ({
      ...m,
      order: index,
      sourceFields: { ...m.sourceFields }
    }))
  emit('update:mappings', mappings)
}
</script>

<style scoped lang="scss">
.column-align-mode {
  padding: 16px;
}

.mode-description {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #e6f7ff;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #1890ff;
  font-size: 14px;
}

.desc-icon {
  font-size: 16px;
}

.align-workspace {
  display: flex;
  gap: 16px;
  min-height: 300px;
  margin-bottom: 16px;
}

.target-columns {
  width: 200px;
  flex-shrink: 0;
}

.column-header {
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
  font-weight: 500;
  text-align: center;
}

.target-slot {
  min-height: 50px;
  border: 1px dashed #d9d9d9;
  border-top: none;
  padding: 8px;
  transition: all 0.2s;
  background: #fff;

  &:last-child {
    border-radius: 0 0 4px 4px;
  }

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
  }

  &.has-value {
    border-style: solid;
    background: #f6ffed;
    border-color: #b7eb8f;
  }
}

.slot-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alias-name {
  font-weight: 500;
  color: #333;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px 6px;

  &:hover {
    color: #ff4d4f;
  }
}

.slot-placeholder {
  color: #bfbfbf;
  text-align: center;
  font-size: 12px;
  line-height: 34px;
}

.source-columns {
  display: flex;
  gap: 12px;
  flex: 1;
  overflow-x: auto;
}

.provider-column {
  min-width: 180px;
  flex-shrink: 0;
}

.source-fields {
  border: 1px solid #e8e8e8;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 280px;
  overflow-y: auto;
}

.source-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: grab;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #e6f7ff;
  }

  &.used {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f5f5f5;
  }

  &:active {
    cursor: grabbing;
  }
}

.field-name {
  font-size: 13px;
  color: #333;
}

.field-type {
  font-size: 11px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  &.danger {
    border-color: #ff4d4f;
    color: #ff4d4f;

    &:hover {
      background: #fff1f0;
    }
  }
}
</style>
