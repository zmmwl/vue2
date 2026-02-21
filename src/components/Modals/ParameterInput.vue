<template>
  <div class="parameter-input">
    <label class="param-label">
      {{ parameter.displayName || parameter.name }}
      <span v-if="parameter.required" class="required-mark">*</span>
    </label>

    <!-- Select 类型 -->
    <select
      v-if="inputType === 'select'"
      v-model="localValue"
      class="param-select"
    >
      <option v-for="opt in parameter.options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <!-- MultiSelect 类型 -->
    <div v-else-if="inputType === 'multiselect'" class="param-multiselect">
      <label v-for="opt in parameter.options" :key="opt.value" class="checkbox-label">
        <input
          type="checkbox"
          :value="opt.value"
          :checked="Array.isArray(localValue) && localValue.includes(opt.value)"
          @change="handleMultiSelectChange(opt.value, $event)"
        />
        <span>{{ opt.label }}</span>
      </label>
    </div>

    <!-- Number 类型 -->
    <input
      v-else-if="inputType === 'number'"
      type="number"
      v-model.number="localValue"
      :min="parameter.min"
      :max="parameter.max"
      :step="parameter.step || 1"
      class="param-input"
    />

    <!-- Boolean 类型 -->
    <label v-else-if="inputType === 'boolean'" class="param-switch">
      <input type="checkbox" v-model="localValue" />
      <span class="switch-slider"></span>
      <span class="switch-label">{{ localValue ? '是' : '否' }}</span>
    </label>

    <!-- Text 类型（默认） -->
    <input
      v-else
      type="text"
      v-model="localValue"
      :placeholder="parameter.placeholder || `请输入${parameter.displayName || parameter.name}`"
      class="param-input"
    />

    <!-- 描述文字 -->
    <div v-if="parameter.description" class="param-desc">
      {{ parameter.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FLTaskParameterDef } from '@/types/fl-tasks'
import { FLParameterDataType } from '@/types/fl-tasks'

const props = defineProps<{
  parameter: FLTaskParameterDef
  value: any
}>()

const emit = defineEmits<{
  (e: 'update:value', value: any): void
}>()

const localValue = ref<any>(props.value)

// 计算输入类型
const inputType = computed(() => {
  const dataType = props.parameter.dataType
  switch (dataType) {
    case FLParameterDataType.SELECT:
      return 'select'
    case FLParameterDataType.MULTISELECT:
      return 'multiselect'
    case FLParameterDataType.NUMBER:
      return 'number'
    case FLParameterDataType.BOOLEAN:
      return 'boolean'
    case FLParameterDataType.TEXT:
    default:
      return 'text'
  }
})

// 监听外部值变化
watch(() => props.value, (newVal) => {
  localValue.value = newVal
}, { immediate: true })

// 监听本地值变化
watch(localValue, (newVal) => {
  emit('update:value', newVal)
})

// 处理多选变化
function handleMultiSelectChange(optValue: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  let currentValues = Array.isArray(localValue.value) ? [...localValue.value] : []

  if (checked && !currentValues.includes(optValue)) {
    currentValues.push(optValue)
  } else if (!checked) {
    currentValues = currentValues.filter(v => v !== optValue)
  }

  localValue.value = currentValues
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.parameter-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);

  .required-mark {
    color: var(--color-error);
    margin-left: 2px;
  }
}

.param-input,
.param-select {
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
}

.param-select {
  cursor: pointer;
}

.param-multiselect {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--input-radius);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;

  input[type="checkbox"] {
    accent-color: var(--color-primary);
  }
}

.param-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch-slider {
    position: relative;
    width: 40px;
    height: 22px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 11px;
    transition: var(--transition-fast);

    &::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      transition: var(--transition-fast);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }

  input:checked + .switch-slider {
    background: var(--color-primary);

    &::before {
      transform: translateX(18px);
    }
  }

  .switch-label {
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.param-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
