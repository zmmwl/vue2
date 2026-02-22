<template>
  <div class="field-editor">
    <div class="editor-header">
      <span class="section-label">字段列表</span>
      <button class="add-btn" @click="addField">
        <span class="add-icon">+</span>
        添加字段
      </button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <span>暂无字段，请点击上方按钮添加</span>
    </div>

    <div v-else class="field-list">
      <div
        v-for="(field, index) in modelValue"
        :key="index"
        class="field-row"
      >
        <!-- 字段名称 -->
        <div class="field-input">
          <label>字段名称</label>
          <input
            type="text"
            v-model="field.name"
            placeholder="字段名（字母、数字、下划线）"
            :class="{ 'is-error': !isValidFieldName(field.name) && field.name }"
          />
        </div>

        <!-- 字段类型 -->
        <div class="field-input">
          <label>字段类型</label>
          <select v-model="field.dataType">
            <option value="STRING">STRING</option>
            <option value="INTEGER">INTEGER</option>
            <option value="FLOAT">FLOAT</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="DATE">DATE</option>
            <option value="TIMESTAMP">TIMESTAMP</option>
          </select>
        </div>

        <!-- 字段描述 -->
        <div class="field-input field-desc">
          <label>描述</label>
          <input
            type="text"
            v-model="field.description"
            placeholder="字段描述（可选）"
          />
        </div>

        <!-- 删除按钮 -->
        <button class="delete-btn" @click="removeField(index)" title="删除字段">
          ×
        </button>
      </div>
    </div>

    <!-- 字段数量提示 -->
    <div v-if="modelValue.length > 0" class="field-count">
      已添加 {{ modelValue.length }} 个字段
      <span v-if="modelValue.length >= 50" class="count-warning">（已达上限）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RealtimeFieldInfo } from '@/types/nodes'

const modelValue = defineModel<RealtimeFieldInfo[]>({ default: () => [] })

// 添加字段
const addField = () => {
  if (modelValue.value.length >= 50) return
  // 使用展开运算符确保响应式更新
  modelValue.value = [
    ...modelValue.value,
    {
      name: '',
      dataType: 'STRING' as const,
      description: ''
    }
  ]
}

// 删除字段
const removeField = (index: number) => {
  modelValue.value = modelValue.value.filter((_, i) => i !== index)
}

// 验证字段名称
const isValidFieldName = (name: string): boolean => {
  if (!name) return false
  // 字段名只能包含字母、数字、下划线，首字符必须为字母或下划线
  return /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(name)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.field-editor {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  padding: 16px;
  background: rgba(0, 0, 0, 0.01);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--datasource-blue);
  background: transparent;
  color: var(--datasource-blue);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: rgba(14, 165, 233, 0.08);
  }

  .add-icon {
    font-size: 14px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 13px;

  .empty-icon {
    font-size: 24px;
    opacity: 0.5;
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.field-input {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  input,
  select {
    height: var(--input-height);
    padding: 0 12px;
    border: 1px solid var(--input-border);
    border-radius: var(--input-radius);
    font-size: 13px;
    background: var(--input-bg);
    transition: var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--input-border-focus);
      box-shadow: var(--input-shadow-focus);
    }

    &.is-error {
      border-color: var(--color-error);
    }
  }

  select {
    min-width: 120px;
    cursor: pointer;
  }
}

.field-desc {
  flex: 1;
  min-width: 150px;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-secondary);
  font-size: 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 77, 79, 0.1);
    color: var(--color-error);
  }
}

.field-count {
  margin-top: 12px;
  font-size: 11px;
  color: var(--text-secondary);

  .count-warning {
    color: var(--color-warning);
  }
}
</style>
