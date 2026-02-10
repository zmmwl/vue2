<template>
  <div class="field-group-card">
    <div class="group-header" @click="$emit('toggle')">
      <span class="group-title">{{ participantId }} / {{ dataset }}</span>
      <span class="field-count">{{ fields.length }}</span>
    </div>
    <div v-if="isExpanded" class="fields-list">
      <div
        v-for="field in fields"
        :key="field.columnAlias"
        class="field-item"
        :class="{ used: usedFieldAliases.has(field.columnAlias) }"
        draggable="true"
        @dragstart="handleDragStart(field, $event)"
      >
        <span class="field-alias">{{ field.columnAlias }}</span>
        <span class="field-type">{{ field.columnType }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FieldInfo {
  columnAlias: string
  columnName: string
  columnType: string
}

interface Props {
  participantId: string
  dataset: string
  fields: FieldInfo[]
  usedFieldAliases: Set<string>
}

const props = defineProps<Props>()
defineEmits<{ toggle: []; fieldDragStart: [payload: { fullRef: string; field: FieldInfo }] }>()

const isExpanded = ref(true)

function handleDragStart(field: FieldInfo, event: DragEvent) {
  const fullRef = `${props.participantId}.${props.dataset}.${field.columnAlias}`
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({ fullRef, field }))
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.field-group-card {
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.group-header:hover {
  background: rgba(14, 165, 233, 0.06);
}

.group-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-count {
  font-size: 11px;
  color: var(--datasource-blue);
  background: rgba(14, 165, 233, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.fields-list {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  max-height: 300px;
  overflow-y: auto;
}

.fields-list::-webkit-scrollbar {
  width: 4px;
}

.fields-list::-webkit-scrollbar-track {
  background: transparent;
}

.fields-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: grab;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.field-item:last-child {
  border-bottom: none;
}

.field-item:hover {
  background: rgba(14, 165, 233, 0.06);
}

.field-item.used {
  background: rgba(82, 196, 26, 0.08);
}

.field-item.used:hover {
  background: rgba(82, 196, 26, 0.12);
}

.field-item:active {
  cursor: grabbing;
}

.field-alias {
  font-size: 13px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.used .field-alias {
  color: #52c41a;
  font-weight: 500;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  margin-left: 8px;
  white-space: nowrap;
}

.used .field-type {
  color: #3a863a;
  background: rgba(82, 196, 26, 0.12);
}
</style>
