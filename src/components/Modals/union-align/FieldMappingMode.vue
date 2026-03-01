<template>
  <div class="field-mapping-mode">
    <div class="mode-description">
      <span class="desc-icon">💡</span>
      <span>创建目标字段，然后为每个数据源选择对应的源字段</span>
    </div>

    <!-- 目标字段列表 -->
    <div class="target-fields">
      <div
        v-for="(mapping, mIndex) in localMappings"
        :key="mIndex"
        class="target-field-card"
      >
        <div class="card-header">
          <span class="field-number">{{ mIndex + 1 }}</span>
          <input
            v-model="mapping.targetAlias"
            type="text"
            class="alias-input"
            placeholder="输入目标字段名称"
            :maxlength="64"
            @input="handleMappingChange"
          />
          <select v-model="mapping.targetType" class="type-select" @change="handleMappingChange">
            <option value="STRING">STRING</option>
            <option value="INTEGER">INTEGER</option>
            <option value="BIGINT">BIGINT</option>
            <option value="FLOAT">FLOAT</option>
            <option value="DOUBLE">DOUBLE</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="DATE">DATE</option>
            <option value="DATETIME">DATETIME</option>
          </select>
          <button class="delete-btn" @click="removeMapping(mIndex)" title="删除字段">
            ✕
          </button>
        </div>

        <div class="card-body">
          <div class="source-mappings">
            <div
              v-for="(provider, pIndex) in providers"
              :key="provider.participantId"
              class="source-mapping-row"
            >
              <span class="provider-label">{{ getProviderLabel(provider, pIndex) }}</span>
              <select
                v-model="mapping.sourceFields[provider.participantId]"
                class="source-select"
                @change="handleMappingChange"
              >
                <option :value="null">-- 不映射 --</option>
                <option
                  v-for="field in getAvailableFields(provider, mapping, mIndex)"
                  :key="field.columnName"
                  :value="field.columnName"
                >
                  {{ field.columnName }} ({{ field.columnType }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加新目标字段 -->
      <div class="add-field-card" @click="addMapping">
        <span class="add-icon">+</span>
        <span class="add-text">添加目标字段</span>
      </div>
    </div>

    <!-- 映射统计 -->
    <div class="mapping-summary">
      <span class="summary-item">
        目标字段: <strong>{{ localMappings.length }}</strong> 个
      </span>
      <span class="summary-item">
        完整映射: <strong>{{ getCompleteMappingCount() }}</strong> 个
      </span>
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

// 初始化
onMounted(() => {
  if (props.fieldMappings.length > 0) {
    localMappings.value = props.fieldMappings.map(m => ({
      ...m,
      sourceFields: { ...m.sourceFields }
    }))
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

// 获取可用字段（排除已映射到其他目标字段的字段）
function getAvailableFields(
  provider: InputProvider,
  _currentMapping: UnionFieldMapping,
  currentIndex: number
): FieldMapping[] {
  const usedFields = new Set<string>()

  localMappings.value.forEach((mapping, index) => {
    if (index !== currentIndex) {
      const field = mapping.sourceFields[provider.participantId]
      if (field) {
        usedFields.add(field)
      }
    }
  })

  return getProviderFields(provider).filter(f => !usedFields.has(f.columnName))
}

// 获取完整映射数量（所有数据源都映射了字段）
function getCompleteMappingCount(): number {
  if (props.providers.length === 0) return 0

  return localMappings.value.filter(m => {
    return props.providers.every(p => m.sourceFields[p.participantId] !== null)
  }).length
}

// 添加映射
function addMapping() {
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

// 删除映射
function removeMapping(index: number) {
  localMappings.value.splice(index, 1)
  // 重新排序
  localMappings.value.forEach((m, i) => {
    m.order = i
  })
  handleMappingChange()
}

// 处理映射变化
function handleMappingChange() {
  const mappings = localMappings.value.map((m, index) => ({
    ...m,
    order: index,
    sourceFields: { ...m.sourceFields }
  }))
  emit('update:mappings', mappings)
}
</script>

<style scoped lang="scss">
.field-mapping-mode {
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

.target-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.target-field-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.field-number {
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

.alias-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.type-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  min-width: 120px;

  &:focus {
    border-color: #1890ff;
    outline: none;
  }
}

.delete-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #ff4d4f;
  }
}

.card-body {
  padding: 12px 16px;
}

.source-mappings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-mapping-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-label {
  width: 80px;
  color: #666;
  font-size: 13px;
}

.source-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;

  &:focus {
    border-color: #1890ff;
    outline: none;
  }
}

.add-field-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #8c8c8c;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
    background: #e6f7ff;
  }
}

.add-icon {
  font-size: 20px;
  font-weight: bold;
}

.add-text {
  font-size: 14px;
}

.mapping-summary {
  display: flex;
  gap: 24px;
  color: #8c8c8c;
  font-size: 13px;
}

.summary-item {
  strong {
    color: #333;
  }
}
</style>
