<template>
  <div class="dynamic-param-form">
    <div class="form-header">
      <span class="form-title">算法参数</span>
      <span class="param-count">({{ params.length }})</span>
    </div>

    <div v-if="params.length === 0" class="empty-params">
      该算法无需配置参数
    </div>

    <div v-else class="params-list">
      <div
        v-for="param in sortedParams"
        :key="param.key"
        class="param-item"
      >
        <div class="param-label">
          <span class="label-text">{{ param.label }}</span>
          <span v-if="param.required" class="required-mark">*</span>
          <span v-if="param.description" class="param-desc" :title="param.description">?</span>
        </div>

        <!-- 字符串类型 -->
        <input
          v-if="param.type === ParamType.STRING"
          type="text"
          class="param-input"
          :value="getStringValue(param.key)"
          :placeholder="param.placeholder"
          @input="handleInput(param.key, ($event.target as HTMLInputElement).value)"
        />

        <!-- 整数类型 -->
        <input
          v-else-if="param.type === ParamType.INTEGER"
          type="number"
          class="param-input"
          :value="getStringValue(param.key)"
          :placeholder="param.placeholder"
          :min="param.validation?.min"
          :max="param.validation?.max"
          step="1"
          @input="handleInput(param.key, parseInt(($event.target as HTMLInputElement).value) || 0)"
        />

        <!-- 浮点数类型 -->
        <input
          v-else-if="param.type === ParamType.FLOAT"
          type="number"
          class="param-input"
          :value="getStringValue(param.key)"
          :placeholder="param.placeholder"
          :min="param.validation?.min"
          :max="param.validation?.max"
          step="any"
          @input="handleInput(param.key, parseFloat(($event.target as HTMLInputElement).value) || 0)"
        />

        <!-- 布尔类型 -->
        <label v-else-if="param.type === ParamType.BOOLEAN" class="param-checkbox">
          <input
            type="checkbox"
            :checked="paramValues[param.key] === true"
            @change="handleInput(param.key, ($event.target as HTMLInputElement).checked)"
          />
          <span class="checkbox-label">启用</span>
        </label>

        <!-- 枚举类型 -->
        <select
          v-else-if="param.type === ParamType.ENUM"
          class="param-select"
          :value="getStringValue(param.key)"
          @change="handleInput(param.key, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">请选择</option>
          <option
            v-for="option in param.validation?.enumOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <!-- 日期类型 -->
        <input
          v-else-if="param.type === ParamType.DATE"
          type="date"
          class="param-input"
          :value="formatDate(param.key)"
          @input="handleInput(param.key, ($event.target as HTMLInputElement).value)"
        />

        <!-- JSON 类型 -->
        <textarea
          v-else-if="param.type === ParamType.JSON"
          class="param-textarea"
          :value="getJsonValue(param.key)"
          :placeholder="param.placeholder || jsonPlaceholder"
          rows="4"
          @input="handleJsonInput(param.key, ($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <!-- 数组类型 -->
        <div v-else-if="param.type === ParamType.ARRAY" class="param-array">
          <div
            v-for="(item, index) in getArrayValue(param.key)"
            :key="index"
            class="array-item"
          >
            <input
              type="text"
              class="array-input"
              :value="item"
              @input="handleArrayInput(param.key, index, ($event.target as HTMLInputElement).value)"
            />
            <button class="remove-btn" @click="removeArrayItem(param.key, index)">×</button>
          </div>
          <button class="add-btn" @click="addArrayItem(param.key)">+ 添加</button>
        </div>

        <!-- 验证错误提示 -->
        <div v-if="errors[param.key]" class="param-error">
          {{ errors[param.key] }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { AlgorithmParamTemplate, ParamValue } from '@/types/algorithm'
import { ParamType } from '@/types/algorithm'

interface Props {
  params: AlgorithmParamTemplate[]
  modelValue: Record<string, ParamValue>
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, ParamValue>): void
  (e: 'validate', valid: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 内部参数值
const paramValues = computed(() => ({ ...props.modelValue }))

// JSON 默认占位符
const jsonPlaceholder = '{\n  "key": "value"\n}'

// 验证错误
const errors = computed(() => {
  const result: Record<string, string> = {}

  for (const param of props.params) {
    const value = paramValues.value[param.key]
    const error = validateParam(param, value)
    if (error) {
      result[param.key] = error
    }
  }

  return result
})

// 按 order 排序的参数列表
const sortedParams = computed(() => {
  return [...props.params].sort((a, b) => a.order - b.order)
})

/**
 * 获取字符串值
 */
function getStringValue(key: string): string {
  const value = paramValues.value[key]
  if (value === undefined || value === null) return ''
  return String(value)
}

/**
 * 获取 JSON 值
 */
function getJsonValue(key: string): string {
  const value = paramValues.value[key]
  if (value === undefined || value === null) return ''
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

/**
 * 获取数组值
 */
function getArrayValue(key: string): string[] {
  const value = paramValues.value[key]
  if (!Array.isArray(value)) return []
  return value.map(v => String(v))
}

/**
 * 格式化日期
 */
function formatDate(key: string): string {
  const value = paramValues.value[key]
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    return value.toISOString().split('T')[0] || ''
  }
  return ''
}

/**
 * 验证单个参数
 */
function validateParam(param: AlgorithmParamTemplate, value: ParamValue | undefined): string {
  // 必填验证
  if (param.required && (value === undefined || value === null || value === '')) {
    return `${param.label}为必填项`
  }

  // 如果值为空且非必填，跳过其他验证
  if (value === undefined || value === null || value === '') {
    return ''
  }

  const validation = param.validation

  if (!validation) {
    return ''
  }

  // 字符串验证
  if (param.type === ParamType.STRING && typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      return `长度不能少于${validation.minLength}个字符`
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `长度不能超过${validation.maxLength}个字符`
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return '格式不正确'
    }
  }

  // 数值验证
  if ((param.type === ParamType.INTEGER || param.type === ParamType.FLOAT) && typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      return `不能小于${validation.min}`
    }
    if (validation.max !== undefined && value > validation.max) {
      return `不能大于${validation.max}`
    }
  }

  // 数组验证
  if (param.type === ParamType.ARRAY && Array.isArray(value)) {
    if (validation.itemMinCount && value.length < validation.itemMinCount) {
      return `至少需要${validation.itemMinCount}个元素`
    }
    if (validation.itemMaxCount && value.length > validation.itemMaxCount) {
      return `最多允许${validation.itemMaxCount}个元素`
    }
  }

  return ''
}

/**
 * 处理输入
 */
function handleInput(key: string, value: ParamValue) {
  const newValues = { ...paramValues.value, [key]: value }
  emit('update:modelValue', newValues)
  emitValidate(newValues)
}

/**
 * 处理 JSON 输入
 */
function handleJsonInput(key: string, value: string) {
  try {
    const parsed = JSON.parse(value)
    handleInput(key, parsed)
  } catch {
    // 如果不是有效的 JSON，存储为字符串
    handleInput(key, value)
  }
}

/**
 * 处理数组输入
 */
function handleArrayInput(key: string, index: number, value: string) {
  const arr = getArrayValue(key)
  arr[index] = value
  handleInput(key, arr)
}

/**
 * 添加数组项
 */
function addArrayItem(key: string) {
  const arr = getArrayValue(key)
  arr.push('')
  handleInput(key, arr)
}

/**
 * 移除数组项
 */
function removeArrayItem(key: string, index: number) {
  const arr = getArrayValue(key)
  arr.splice(index, 1)
  handleInput(key, arr)
}

/**
 * 发送验证结果
 */
function emitValidate(newValues: Record<string, ParamValue>) {
  // 重新计算错误
  let hasErrors = false
  for (const param of props.params) {
    const value = newValues[param.key]
    if (validateParam(param, value)) {
      hasErrors = true
      break
    }
  }
  emit('validate', !hasErrors)
}

// 初始化默认值
watch(
  () => props.params,
  (params) => {
    const newValues = { ...paramValues.value }
    let hasChanges = false

    for (const param of params) {
      if (newValues[param.key] === undefined && param.defaultValue !== undefined) {
        newValues[param.key] = param.defaultValue
        hasChanges = true
      }
    }

    if (hasChanges) {
      emit('update:modelValue', newValues)
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.dynamic-param-form {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.form-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.param-count {
  font-size: 12px;
  color: #9ca3af;
}

.empty-params {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 16px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-text {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.required-mark {
  color: #ef4444;
  font-size: 12px;
}

.param-desc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 10px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: help;
}

.param-input,
.param-select,
.param-textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.param-textarea {
  resize: vertical;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.param-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .checkbox-label {
    font-size: 13px;
    color: #374151;
  }
}

.param-array {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-item {
  display: flex;
  gap: 8px;
}

.array-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.remove-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #fecaca;
  }
}

.add-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  border: 1px dashed #1890ff;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #bae7ff;
  }
}

.param-error {
  font-size: 11px;
  color: #ef4444;
  margin-top: 2px;
}
</style>
