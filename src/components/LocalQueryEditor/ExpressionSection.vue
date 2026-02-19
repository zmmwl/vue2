<template>
  <div class="expression-section">
    <!-- 说明 -->
    <div class="info-banner">
      <p class="info-text">💡 使用 Python 语法编写表达式，支持输入数据字段引用</p>
      <p class="info-hint">字段引用格式: <code>participantId.dataset.columnAlias</code></p>
    </div>

    <!-- 空状态 -->
    <div v-if="expressions.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>暂无表达式</p>
      <p class="empty-hint">点击下方按钮添加表达式</p>
    </div>

    <!-- 表达式列表 -->
    <div v-else class="expressions-list">
      <ExpressionSubSection
        v-for="(expr, index) in expressions"
        :key="expr.id"
        :expression-config="expr"
        :index="index + 1"
        :input-providers="inputProviders"
        @update="updateExpression(index, $event)"
        @delete="deleteExpression(index)"
      />
    </div>

    <!-- 添加按钮 -->
    <button class="add-btn" @click="addExpression">+ 添加表达式</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { InputProvider, ExpressionConfig } from '@/types/nodes'
import ExpressionSubSection from './ExpressionSubSection.vue'

interface Props {
  modelValue: ExpressionConfig[]
  inputProviders: InputProvider[]
}

interface Emits {
  (e: 'update:modelValue', expressions: ExpressionConfig[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 内部状态
const expressions = ref<ExpressionConfig[]>([])

// 监听 props 变化
watch(() => props.modelValue, (newVal) => {
  expressions.value = newVal ? [...newVal] : []
}, { immediate: true, deep: true })

// 添加表达式
function addExpression() {
  const newExpr: ExpressionConfig = {
    id: `expr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    expression: '',
    resultAlias: `expr_${expressions.value.length + 1}`
  }
  expressions.value.push(newExpr)
  emitChanges()
}

// 更新表达式
function updateExpression(index: number, config: ExpressionConfig) {
  if (index >= 0 && index < expressions.value.length) {
    expressions.value[index] = { ...config }
    emitChanges()
  }
}

// 删除表达式
function deleteExpression(index: number) {
  if (index >= 0 && index < expressions.value.length) {
    expressions.value.splice(index, 1)
    emitChanges()
  }
}

// 发送更新
function emitChanges() {
  emit('update:modelValue', [...expressions.value])
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.expression-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-banner {
  padding: 10px 14px;
  background: rgba(19, 194, 194, 0.06);
  border: 1px solid rgba(19, 194, 194, 0.15);
  border-radius: 6px;
}

.info-text {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: var(--text-primary);
}

.info-hint {
  margin: 0;
  font-size: 11px;
  color: var(--text-secondary);

  code {
    padding: 1px 5px;
    background: rgba(19, 194, 194, 0.1);
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    color: #13C2C2;
    font-size: 10px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(0, 0, 0, 0.1);

  .empty-icon {
    font-size: 36px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  p {
    margin: 2px 0;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .empty-hint {
    font-size: 11px;
    opacity: 0.8;
  }
}

.expressions-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.add-btn {
  width: 100%;
  padding: 10px;
  background: rgba(19, 194, 194, 0.06);
  color: #13C2C2;
  border: 1px dashed rgba(19, 194, 194, 0.25);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(19, 194, 194, 0.1);
    border-color: rgba(19, 194, 194, 0.4);
  }
}
</style>
