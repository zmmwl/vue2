<template>
  <div class="expression-tab">
    <!-- 说明 -->
    <div class="info-banner">
      <p class="info-text">💡 使用 Python 语法编写表达式，支持输入数据字段引用</p>
      <p class="info-hint">字段引用格式: <code>participantId.dataset.columnAlias</code></p>
    </div>

    <!-- 表达式编辑器容器 -->
    <div class="editor-container">
      <!-- 字段列表侧边栏 -->
      <div v-if="inputProviders.length > 0" class="fields-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">可用字段</span>
        </div>
        <div class="fields-list">
          <div
            v-for="provider in inputProviders"
            :key="provider.sourceNodeId"
            class="provider-group"
          >
            <div class="provider-name">{{ provider.participantId }}.{{ provider.dataset }}</div>
            <div
              v-for="field in provider.fields"
              :key="field.columnName"
              class="field-item"
              draggable="true"
              @dragstart="handleDragStart($event, provider, field)"
            >
              <span class="field-name">{{ field.columnAlias || field.columnName }}</span>
              <span class="field-type">{{ field.columnType }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑器 -->
      <div class="editor-wrapper">
        <div ref="editorContainer" class="code-editor"></div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-banner">
      <span class="error-icon">⚠️</span>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { python } from '@codemirror/lang-python'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { autocompletion, CompletionContext, type Completion } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { EditorSelection } from '@codemirror/state'
import type { InputProvider, FieldMapping } from '@/types/nodes'

interface Props {
  modelValue: string
  inputProviders: InputProvider[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null
const languageCompartment = new Compartment()
const errorMessage = ref('')

// 获取所有可用字段
const availableFields = computed(() => {
  const fields: Array<{
    name: string
    participantId: string
    dataset: string
    dataType: string
  }> = []

  props.inputProviders.forEach(provider => {
    provider.fields.forEach(field => {
      fields.push({
        name: field.columnAlias || field.columnName,
        participantId: provider.participantId,
        dataset: provider.dataset,
        dataType: field.columnType
      })
    })
  })

  return fields
})

// 格式化字段引用
function formatFieldRef(participantId: string, dataset: string, fieldName: string): string {
  return `${participantId}.${dataset}.${fieldName}`
}

// 创建字段补全
function createFieldCompletions(): Completion[] {
  return availableFields.value.map(field => {
    const ref = formatFieldRef(field.participantId, field.dataset, field.name)
    return {
      label: ref,
      type: 'variable',
      detail: `${field.participantId} / ${field.dataset}`,
      info: `字段类型: ${field.dataType}`
    } as Completion
  })
}

// 自定义补全源
function createCompletionSource() {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/\w*\.?\w*/)
    if (!word || (word.from === word.to && !context.explicit)) {
      return null
    }

    const completions = createFieldCompletions()
    if (completions.length === 0) return null

    return {
      from: word.from,
      options: completions
    }
  }
}

// 创建编辑器扩展
function createExtensions(): Extension[] {
  const lightTheme = EditorView.theme({
    '&': {
      fontSize: '14px',
      fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#262626'
    },
    '.cm-scroller': {
      overflow: 'auto',
      background: 'transparent',
    },
    '.cm-content': {
      padding: '16px',
      minHeight: '200px',
    },
    '.cm-line': {
      padding: '0 2px',
    },
    '& .cm-activeLine': {
      background: 'rgba(14, 165, 233, 0.06)'
    },
    '& .cm-selectionBackground': {
      background: 'rgba(19, 194, 194, 0.2)'
    },
    '& .cm-cursor': {
      borderLeftColor: '#13C2C2'
    },
    '.cm-tooltip': {
      background: 'rgba(255, 255, 255, 0.98)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
    }
  }, { dark: false })

  return [
    lightTheme,
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, indentWithTab]),
    autocompletion({
      override: [createCompletionSource()],
      activateOnTyping: true
    }),
    bracketMatching(),
    placeholderExt('# 在此输入 Python 表达式...\n# 示例: salary * 0.8 + bonus'),
    languageCompartment.of(python())
  ]
}

// 处理字段拖拽
function handleDragStart(event: DragEvent, provider: InputProvider, field: FieldMapping) {
  const ref = formatFieldRef(
    provider.participantId,
    provider.dataset,
    field.columnAlias || field.columnName
  )
  event.dataTransfer?.setData('text/plain', ref)
}

// 初始化编辑器
async function initEditor() {
  if (!editorContainer.value) return

  await nextTick()

  if (editorView) {
    editorView.destroy()
  }

  const dropHandler = EditorView.domEventHandlers({
    drop: (event: DragEvent) => {
      const text = event.dataTransfer?.getData('text/plain')
      if (!text || !editorView) return false

      const pos = editorView.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos === null) return false

      editorView.dispatch({
        changes: { from: pos, to: pos, insert: text },
        selection: EditorSelection.cursor(pos + text.length)
      })

      event.preventDefault()
      return true
    },
    dragover: (event: DragEvent) => {
      event.preventDefault()
      return true
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      ...createExtensions(),
      dropHandler,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString()
          emit('update:modelValue', value)
          validateExpression(value)
        }
      }),
      EditorView.editable.of(true)
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

// 验证表达式
function validateExpression(expr: string) {
  errorMessage.value = ''

  if (!expr.trim()) return

  // 检查括号匹配
  const openBrackets = (expr.match(/\(/g) || []).length
  const closeBrackets = (expr.match(/\)/g) || []).length
  if (openBrackets !== closeBrackets) {
    errorMessage.value = '括号不匹配'
    return
  }

  // 检查引号闭合
  const singleQuotes = (expr.match(/'/g) || []).length
  if (singleQuotes % 2 !== 0) {
    errorMessage.value = '字符串引号不闭合'
  }
}

// 监听显示状态
watch(() => props.modelValue, async (newVal, oldVal) => {
  if (editorView && newVal !== oldVal && newVal !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newVal }
    })
  }
})

// 监听可用字段变化
watch(() => props.inputProviders, () => {
  // 重新初始化编辑器以更新补全列表
  if (editorContainer.value) {
    initEditor()
  }
}, { deep: true })

// 组件卸载时清理
onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy()
  }
})

// 初始化
watch(() => editorContainer.value, (container) => {
  if (container) {
    initEditor()
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.expression-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-banner {
  padding: 12px 16px;
  background: rgba(19, 194, 194, 0.08);
  border: 1px solid rgba(19, 194, 194, 0.2);
  border-radius: 8px;
}

.info-text {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: var(--text-primary);
}

.info-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);

  code {
    padding: 2px 6px;
    background: rgba(19, 194, 194, 0.1);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    color: #13C2C2;
  }
}

.editor-container {
  display: flex;
  gap: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.fields-sidebar {
  width: 240px;
  background: rgba(0, 0, 0, 0.02);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fields-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.provider-group {
  margin-bottom: 12px;
}

.provider-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  margin-bottom: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  margin: 2px 0;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    background: rgba(19, 194, 194, 0.1);
  }

  &:active {
    cursor: grabbing;
  }
}

.field-name {
  font-size: 12px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.field-type {
  font-size: 10px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
}

.editor-wrapper {
  flex: 1;
  min-width: 0;
}

.code-editor {
  height: 100%;
  min-height: 300px;

  :deep(.cm-editor) {
    height: 100% !important;

    &.cm-focused {
      outline: none;
    }

    .cm-scroller {
      overflow: auto;
      height: 100%;
    }
  }
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 77, 79, 0.08);
  border: 1px solid rgba(255, 77, 79, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #ff4d4f;
}

.error-icon {
  font-size: 16px;
}
</style>
