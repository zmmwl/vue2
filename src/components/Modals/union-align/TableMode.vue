<template>
  <div class="table-mode">
    <div class="table-container">
      <table class="align-table">
        <thead>
          <tr>
            <th class="col-order">#</th>
            <th class="col-alias">统一别名</th>
            <th class="col-type">类型</th>
            <th
              v-for="(provider, pIndex) in providers"
              :key="provider.participantId"
              class="col-source"
            >
              {{ getProviderLabel(provider, pIndex) }}
            </th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(mapping, mIndex) in localMappings"
            :key="mIndex"
            class="mapping-row"
          >
            <td class="col-order">{{ mIndex + 1 }}</td>
            <td class="col-alias">
              <input
                v-model="mapping.targetAlias"
                type="text"
                class="alias-input"
                placeholder="输入统一别名"
                :maxlength="64"
                @input="handleMappingChange"
              />
              <span v-if="getAliasError(mapping.targetAlias)" class="error-hint">
                {{ getAliasError(mapping.targetAlias) }}
              </span>
            </td>
            <td class="col-type">
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
            </td>
            <td
              v-for="provider in providers"
              :key="provider.participantId"
              class="col-source"
            >
              <select
                v-model="mapping.sourceFields[provider.participantId]"
                class="source-select"
                @change="handleMappingChange"
              >
                <option :value="null">-- 选择字段 --</option>
                <option
                  v-for="field in provider.fields"
                  :key="field.columnName"
                  :value="field.columnName"
                >
                  {{ field.columnName }} ({{ field.columnType }})
                </option>
              </select>
            </td>
            <td class="col-actions">
              <button class="action-btn delete-btn" @click="removeMapping(mIndex)" title="删除">
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加新映射 -->
    <div class="add-mapping">
      <button class="add-btn" @click="addMapping">
        + 添加字段映射
      </button>
    </div>

    <!-- 映射统计 -->
    <div class="mapping-stats">
      <span>已配置 {{ localMappings.filter(m => m.targetAlias).length }} 个字段</span>
      <span v-if="providers.length > 0">
        | 数据源: {{ providers.length }} 个
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { InputProvider, UnionFieldMapping } from '@/types/nodes'

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
  } else {
    // 默认创建几个空映射
    addMapping()
    addMapping()
    addMapping()
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

// 别名校验
function getAliasError(alias: string): string {
  if (!alias) return ''
  if (alias.length < 1 || alias.length > 64) {
    return '别名长度需在1-64字符之间'
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(alias)) {
    return '仅支持中文、英文、数字和下划线'
  }
  return ''
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
.table-mode {
  padding: 16px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 16px;
}

.align-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 10px 12px;
    border: 1px solid #e8e8e8;
    text-align: left;
  }

  th {
    background: #fafafa;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
  }

  .col-order {
    width: 40px;
    text-align: center;
  }

  .col-alias {
    min-width: 150px;
  }

  .col-type {
    width: 120px;
  }

  .col-source {
    min-width: 180px;
  }

  .col-actions {
    width: 60px;
    text-align: center;
  }
}

.mapping-row {
  &:hover {
    background: #fafafa;
  }
}

.alias-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.error-hint {
  display: block;
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.type-select,
.source-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;

  &:focus {
    border-color: #1890ff;
    outline: none;
  }
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &.delete-btn {
    background: transparent;
    color: #ff4d4f;

    &:hover {
      background: #fff1f0;
    }
  }
}

.add-mapping {
  margin-bottom: 12px;
}

.add-btn {
  padding: 8px 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: transparent;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    background: #e6f7ff;
  }
}

.mapping-stats {
  color: #8c8c8c;
  font-size: 12px;
}
</style>
