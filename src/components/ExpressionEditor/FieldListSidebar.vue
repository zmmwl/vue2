<template>
  <div class="field-sidebar" :class="{ collapsed: !visible }">
    <div class="sidebar-header">
      <h4>可用字段</h4>
      <button class="toggle-btn" @click="$emit('toggle')">
        {{ visible ? '◀' : '▶' }}
      </button>
    </div>
    <div v-if="visible" class="sidebar-content">
      <input
        v-model="searchKeyword"
        placeholder="搜索字段..."
        class="search-input"
      />
      <div class="field-groups">
        <FieldGroupCard
          v-for="group in filteredGroups"
          :key="group.key"
          :participant-id="group.participantId"
          :dataset="group.dataset"
          :fields="group.fields"
          :used-field-aliases="usedFieldAliases"
          @toggle="toggleGroup(group.key)"
          @field-dragstart="(e: any) => $emit('fieldDragStart', e)"
        />
        <div v-if="filteredGroups.length === 0" class="no-fields">
          没有找到匹配的字段
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FieldGroupCard from './FieldGroupCard.vue'
import type { InputProvider } from '@/types/nodes'

interface Props {
  inputProviders: InputProvider[]
  currentExpression: string
  visible: boolean
}

const props = defineProps<Props>()
defineEmits<{
  toggle: []
  fieldDragStart: [payload: { fullRef: string; field: any }]
}>()

const searchKeyword = ref('')
const expandedGroups = ref<Set<string>>(new Set())

// 按数据源分组
const fieldGroups = computed(() => {
  const groups: Map<string, {
    key: string
    participantId: string
    dataset: string
    fields: Array<{
      columnAlias: string
      columnName: string
      columnType: string
    }>
  }> = new Map()

  props.inputProviders.forEach(provider => {
    const key = `${provider.participantId}.${provider.dataset}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        participantId: provider.participantId,
        dataset: provider.dataset,
        fields: []
      })
    }
    groups.get(key)!.fields.push(
      ...provider.fields.map(f => ({
        columnAlias: f.columnAlias || f.columnName,
        columnName: f.columnName,
        columnType: f.columnType
      }))
    )
  })

  return Array.from(groups.values())
})

// 搜索过滤
const filteredGroups = computed(() => {
  if (!searchKeyword.value) return fieldGroups.value

  const keyword = searchKeyword.value.toLowerCase()
  return fieldGroups.value
    .map(group => ({
      ...group,
      fields: group.fields.filter(
        f =>
          f.columnAlias.toLowerCase().includes(keyword) ||
          f.columnName.toLowerCase().includes(keyword)
      )
    }))
    .filter(g => g.fields.length > 0)
})

// 已使用的字段别名
const usedFieldAliases = computed(() => {
  const aliases = new Set<string>()
  // 使用 [\w\u4e00-\u9fa5]+ 支持中文字符
  const pattern = /[\w\u4e00-\u9fa5]+\.[\w\u4e00-\u9fa5]+\.([\w\u4e00-\u9fa5]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(props.currentExpression)) !== null) {
    if (match[1] !== undefined) {
      aliases.add(match[1])
    }
  }
  return aliases
})

// 切换分组展开/折叠状态
function toggleGroup(key: string) {
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key)
  } else {
    expandedGroups.value.add(key)
  }
}
</script>

<style scoped>
.field-sidebar {
  width: 280px;
  background: #1e1e1e;
  border-right: 1px solid #3e3e3e;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.field-sidebar.collapsed {
  width: 40px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #3e3e3e;
  background: #252526;
}

.sidebar-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapsed .sidebar-header h4 {
  display: none;
}

.toggle-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 12px;
}

.toggle-btn:hover {
  background: #3e3e3e;
  color: #e0e0e0;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-input {
  margin: 12px;
  padding: 8px 12px;
  background: #2d2d30;
  border: 1px solid #3e3e3e;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1890ff;
}

.search-input::placeholder {
  color: #6e6e6e;
}

.field-groups {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.field-groups::-webkit-scrollbar {
  width: 6px;
}

.field-groups::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.field-groups::-webkit-scrollbar-thumb {
  background: #3e3e3e;
  border-radius: 3px;
}

.field-groups::-webkit-scrollbar-thumb:hover {
  background: #4e4e4e;
}

.no-fields {
  padding: 24px;
  text-align: center;
  color: #6e6e6e;
  font-size: 13px;
}
</style>
