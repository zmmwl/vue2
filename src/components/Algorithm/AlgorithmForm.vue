<template>
  <div class="algorithm-form">
    <!-- 基本信息 -->
    <div class="form-section">
      <h3 class="section-title">基本信息</h3>
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label required">算法名称</label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="如：SPDZ协议算法"
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
        </div>

        <div class="form-item">
          <label class="form-label required">英文名称</label>
          <input
            v-model="formData.nameEn"
            type="text"
            class="form-input"
            placeholder="如：SPDZ（仅字母数字下划线）"
          />
          <span v-if="errors.nameEn" class="error-text">{{ errors.nameEn }}</span>
        </div>

        <div class="form-item">
          <label class="form-label required">版本号</label>
          <input
            v-model="formData.version"
            type="text"
            class="form-input"
            placeholder="如：v1.0"
          />
          <span v-if="errors.version" class="error-text">{{ errors.version }}</span>
        </div>

        <div class="form-item">
          <label class="form-label required">算法类型</label>
          <select v-model="formData.type" class="form-select">
            <option value="">请选择</option>
            <option v-for="type in algorithmTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
          <span v-if="errors.type" class="error-text">{{ errors.type }}</span>
        </div>

        <div class="form-item full-width">
          <label class="form-label">算法描述</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="算法的详细描述..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 参数模板 -->
    <div class="form-section">
      <div class="section-header">
        <h3 class="section-title">参数模板</h3>
        <button type="button" class="add-param-btn" @click="addParam">
          + 添加参数
        </button>
      </div>

      <div v-if="formData.paramTemplate.length === 0" class="empty-params">
        暂无参数，点击上方按钮添加
      </div>

      <div v-else class="params-list">
        <div
          v-for="(param, index) in formData.paramTemplate"
          :key="index"
          class="param-card"
        >
          <div class="param-header">
            <span class="param-index">参数 {{ index + 1 }}</span>
            <button type="button" class="remove-param-btn" @click="removeParam(index)">
              删除
            </button>
          </div>

          <div class="param-form-grid">
            <div class="param-form-item">
              <label class="param-label required">参数键名</label>
              <input
                v-model="param.key"
                type="text"
                class="param-input"
                placeholder="如：iterationCount"
              />
            </div>

            <div class="param-form-item">
              <label class="param-label required">显示标签</label>
              <input
                v-model="param.label"
                type="text"
                class="param-input"
                placeholder="如：迭代次数"
              />
            </div>

            <div class="param-form-item">
              <label class="param-label required">参数类型</label>
              <select v-model="param.type" class="param-select">
                <option v-for="ptype in paramTypes" :key="ptype.value" :value="ptype.value">
                  {{ ptype.label }}
                </option>
              </select>
            </div>

            <div class="param-form-item">
              <label class="param-label">默认值</label>
              <input
                v-model="param.defaultValue"
                type="text"
                class="param-input"
                placeholder="可选"
              />
            </div>

            <div class="param-form-item checkbox-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="param.required" />
                <span>必填</span>
              </label>
            </div>

            <div class="param-form-item">
              <label class="param-label">显示顺序</label>
              <input
                v-model.number="param.order"
                type="number"
                class="param-input"
                min="1"
              />
            </div>

            <div class="param-form-item full-width">
              <label class="param-label">描述</label>
              <input
                v-model="param.description"
                type="text"
                class="param-input"
                placeholder="参数说明"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <button type="button" class="cancel-btn" @click="handleCancel">取消</button>
      <button type="button" class="save-btn" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Algorithm, AlgorithmParamTemplate } from '@/types/algorithm'
import { AlgorithmType, AlgorithmTypeLabels, ParamType } from '@/types/algorithm'
import { algorithmService } from '@/services/algorithmService'

interface Props {
  editAlgorithm?: Algorithm | null
}

interface Emits {
  (e: 'save', algorithm: Algorithm): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单数据
const formData = reactive({
  name: '',
  nameEn: '',
  version: '',
  type: '' as AlgorithmType | '',
  description: '',
  paramTemplate: [] as AlgorithmParamTemplate[]
})

// 错误信息
const errors = reactive<Record<string, string>>({})

// 保存状态
const saving = ref(false)

// 算法类型选项
const algorithmTypes = computed(() => {
  return Object.entries(AlgorithmTypeLabels).map(([value, label]) => ({
    value,
    label
  }))
})

// 参数类型选项
const paramTypes = [
  { value: ParamType.STRING, label: '字符串' },
  { value: ParamType.INTEGER, label: '整数' },
  { value: ParamType.FLOAT, label: '浮点数' },
  { value: ParamType.BOOLEAN, label: '布尔值' },
  { value: ParamType.ENUM, label: '枚举' },
  { value: ParamType.DATE, label: '日期' },
  { value: ParamType.JSON, label: 'JSON' },
  { value: ParamType.ARRAY, label: '数组' }
]

/**
 * 添加参数
 */
function addParam() {
  formData.paramTemplate.push({
    key: '',
    label: '',
    type: ParamType.STRING,
    required: false,
    order: formData.paramTemplate.length + 1
  })
}

/**
 * 移除参数
 */
function removeParam(index: number) {
  formData.paramTemplate.splice(index, 1)
  // 更新顺序
  formData.paramTemplate.forEach((p, i) => {
    p.order = i + 1
  })
}

/**
 * 验证表单
 */
function validateForm(): boolean {
  // 清空错误
  Object.keys(errors).forEach(key => delete errors[key])

  // 验证必填字段
  if (!formData.name.trim()) {
    errors.name = '请输入算法名称'
  }
  if (!formData.nameEn.trim()) {
    errors.nameEn = '请输入英文名称'
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.nameEn)) {
    errors.nameEn = '英文名称只能包含字母、数字和下划线'
  }
  if (!formData.version.trim()) {
    errors.version = '请输入版本号'
  } else if (!/^v\d+\.\d+$/.test(formData.version)) {
    errors.version = '版本号格式应为 vX.Y（如 v1.0）'
  }
  if (!formData.type) {
    errors.type = '请选择算法类型'
  }

  // 验证参数模板
  for (let i = 0; i < formData.paramTemplate.length; i++) {
    const param = formData.paramTemplate[i]
    if (param) {
      if (!param.key.trim()) {
        errors[`param_${i}_key`] = '请输入参数键名'
      }
      if (!param.label.trim()) {
        errors[`param_${i}_label`] = '请输入显示标签'
      }
    }
  }

  return Object.keys(errors).length === 0
}

/**
 * 处理保存
 */
async function handleSave() {
  if (!validateForm()) {
    return
  }

  saving.value = true
  try {
    const input = {
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim(),
      version: formData.version.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type as AlgorithmType,
      paramTemplate: formData.paramTemplate
    }

    const response = await algorithmService.create(input)
    if (response.code === 0 && response.data) {
      emit('save', response.data)
    } else {
      alert(response.message || '保存失败')
    }
  } catch (error) {
    console.error('Failed to save algorithm:', error)
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel')
}

// 监听编辑数据
watch(
  () => props.editAlgorithm,
  (algo) => {
    if (algo) {
      formData.name = algo.name
      formData.nameEn = algo.nameEn
      formData.version = algo.version
      formData.type = algo.type
      formData.description = algo.description || ''
      formData.paramTemplate = [...(algo.paramTemplate || [])]
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.algorithm-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;

  .section-header & {
    margin: 0;
  }
}

.add-param-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  border: 1px solid #1890ff;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #bae7ff;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full-width {
    grid-column: span 2;
  }
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;

  &.required::after {
    content: '*';
    color: #ef4444;
    margin-left: 2px;
  }
}

.form-input,
.form-select,
.form-textarea {
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.form-textarea {
  resize: vertical;
}

.error-text {
  font-size: 11px;
  color: #ef4444;
}

.empty-params {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 13px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.param-index {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.remove-param-btn {
  font-size: 12px;
  color: #ef4444;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: #dc2626;
  }
}

.param-form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.param-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full-width {
    grid-column: span 3;
  }

  &.checkbox-item {
    justify-content: flex-end;
    padding-top: 20px;
  }
}

.param-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;

  &.required::after {
    content: '*';
    color: #ef4444;
    margin-left: 2px;
  }
}

.param-input,
.param-select {
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 8px 20px;
  font-size: 13px;
  color: #6b7280;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
}

.save-btn {
  padding: 8px 20px;
  font-size: 13px;
  color: #ffffff;
  background: #1890ff;
  border: 1px solid #1890ff;
  border-radius: 6px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #40a9ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
