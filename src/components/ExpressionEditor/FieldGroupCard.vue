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

<style scoped>
.field-group-card {
  margin-bottom: 8px;
  background: #252526;
  border-radius: 4px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.group-header:hover {
  background: #2d2d30;
}

.group-title {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-count {
  font-size: 11px;
  color: #6e6e6e;
  background: #1e1e1e;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.fields-list {
  border-top: 1px solid #3e3e3e;
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
  background: #3e3e3e;
  border-radius: 2px;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: grab;
  transition: background 0.15s;
  border-bottom: 1px solid #1e1e1e;
}

.field-item:last-child {
  border-bottom: none;
}

.field-item:hover {
  background: #2d2d30;
}

.field-item.used {
  background: #1a2f1a;
  color: #52c41a;
}

.field-item.used:hover {
  background: #1e381e;
}

.field-item:active {
  cursor: grabbing;
}

.field-alias {
  font-size: 13px;
  color: #e0e0e0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.used .field-alias {
  color: #52c41a;
}

.field-type {
  font-size: 11px;
  color: #6e6e6e;
  padding: 2px 6px;
  background: #1e1e1e;
  border-radius: 3px;
  margin-left: 8px;
  white-space: nowrap;
}

.used .field-type {
  color: #3a863a;
  background: #0f1f0f;
}
</style>
