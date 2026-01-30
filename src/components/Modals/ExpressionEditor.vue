<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
        <div class="modal-content large" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">编辑表达式模型</h3>
            <button class="close-button" @click="handleCancel">✕</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 说明 -->
            <div class="expression-info">
              <p class="info-text">💡 使用 Python 语法编写表达式，支持输入数据字段引用</p>
              <p class="info-hint">字段引用格式: <code>participantId.dataset.columnName</code></p>
            </div>

            <!-- Monaco Editor 容器 -->
            <div ref="editorContainer" class="editor-container"></div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              ⚠️ {{ errorMessage }}
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button
              class="btn btn-confirm"
              :disabled="!expression.trim()"
              @click="handleConfirm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

interface Props {
  modelValue: boolean
  initialExpression?: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  availableFields?: Array<{ name: string; participantId: string; dataset: string }>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', expression: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Editor 相关
const editorContainer = ref<HTMLElement>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let editor: any = null

// 表达式
const expression = ref(props.initialExpression || '')

// 错误信息
const errorMessage = ref('')

/**
 * 初始化 Monaco Editor
 */
async function initEditor() {
  if (!editorContainer.value) return

  await nextTick()

  // 动态导入 Monaco Editor
  const monacoModule = await import('monaco-editor')
  const monaco = monacoModule.default || monacoModule

  // 销毁已存在的 editor
  if (editor) {
    editor.dispose()
  }

  // 创建 editor
  editor = monaco.editor.create(editorContainer.value, {
    value: expression.value,
    language: 'python',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 }
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    if (editor) {
      expression.value = editor.getValue()
      validateExpression()
    }
  })
}

/**
 * 验证表达式
 */
function validateExpression() {
  errorMessage.value = ''

  if (!expression.value.trim()) {
    return
  }

  // 简单的语法检查
  try {
    // 检查括号匹配
    const openBrackets = (expression.value.match(/\(/g) || []).length
    const closeBrackets = (expression.value.match(/\)/g) || []).length
    if (openBrackets !== closeBrackets) {
      errorMessage.value = '括号不匹配'
      return
    }

    // 检查未闭合的字符串
    const singleQuotes = (expression.value.match(/'/g) || []).length
    if (singleQuotes % 2 !== 0) {
      errorMessage.value = '字符串引号不闭合'
      return
    }
  } catch (error) {
    errorMessage.value = '表达式语法错误'
  }
}

/**
 * 确认
 */
function handleConfirm() {
  if (!expression.value.trim()) return
  emit('confirm', expression.value)
  emit('update:modelValue', false)
}

/**
 * 取消
 */
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

// 监听对话框显示状态
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 对话框打开时初始化 editor
    expression.value = props.initialExpression || ''
    initEditor()
  } else {
    // 对话框关闭时销毁 editor
    if (editor) {
      editor.dispose()
      editor = null
    }
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.large {
    max-width: 900px;
    height: 70vh;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.close-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: #cccccc;
  transition: all 0.2s ease;

  &:hover {
    background: #3e3e42;
    color: #ffffff;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expression-info {
  padding: 12px 16px;
  background: rgba(24, 144, 255, 0.1);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 8px;
}

.info-text {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #cccccc;
  line-height: 1.5;
}

.info-hint {
  margin: 0;
  font-size: 12px;
  color: #999999;

  code {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    color: #1890ff;
  }
}

.editor-container {
  flex: 1;
  min-height: 300px;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  overflow: hidden;
}

.error-message {
  padding: 12px 16px;
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #ff4d4f;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #252526;
  border-top: 1px solid #3e3e42;
}

.btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-cancel {
    background: transparent;
    border: 1px solid #3e3e42;
    color: #cccccc;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }

  &.btn-confirm {
    background: #1890ff;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #40a9ff;
    }

    &:disabled {
      background: #3e3e42;
      color: #666666;
      cursor: not-allowed;
    }
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.9);
  }
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;

  .modal-content {
    transform: scale(1);
  }
}
</style>
