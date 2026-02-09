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
              <p class="info-hint">字段引用格式: <code>participantId.dataset.columnAlias</code></p>
            </div>

            <!-- 表达式编辑器容器（包含侧边栏和编辑器） -->
            <div class="expression-editor-container">
              <FieldListSidebar
                v-if="inputProviders && inputProviders.length > 0"
                :input-providers="inputProviders"
                :current-expression="expression"
                :visible="sidebarVisible"
                @toggle="sidebarVisible = !sidebarVisible"
                @field-dragstart="handleFieldDragStart"
              />
              <div class="editor-wrapper">
                <div ref="editorContainer" class="editor-container"></div>
              </div>
            </div>

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
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { autocompletion, CompletionContext, type Completion } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import type { Extension } from '@codemirror/state'
import { EditorSelection } from '@codemirror/state'
import FieldListSidebar from '@/components/ExpressionEditor/FieldListSidebar.vue'
import type { InputProvider } from '@/types/nodes'

interface CompletionField {
  name: string
  columnName?: string  // 原始字段名
  participantId: string
  dataset: string
  dataType?: string
}

interface Props {
  modelValue: boolean
  initialExpression?: string
  availableFields?: Array<{ name: string; participantId: string; dataset: string }>
  inputProviders?: InputProvider[]
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
let editorView: EditorView | null = null
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()

// 表达式
const expression = ref(props.initialExpression || '')

// 错误信息
const errorMessage = ref('')

// 侧边栏可见性
const sidebarVisible = ref(true)

// 常用 Python 函数和关键字
const pythonKeywords = [
  'and', 'or', 'not', 'True', 'False', 'None',
  'if', 'else', 'elif', 'for', 'while', 'in', 'is',
  'def', 'return', 'lambda', 'class', 'import', 'from'
]

const pythonFunctions = [
  { label: 'sum', detail: '求和', info: 'sum(iterable) - 返回可迭代对象的总和' },
  { label: 'abs', detail: '绝对值', info: 'abs(x) - 返回x的绝对值' },
  { label: 'round', detail: '四舍五入', info: 'round(x[, n]) - 返回x的四舍五入值' },
  { label: 'min', detail: '最小值', info: 'min(iterable) - 返回最小值' },
  { label: 'max', detail: '最大值', info: 'max(iterable) - 返回最大值' },
  { label: 'len', detail: '长度', info: 'len(obj) - 返回对象的长度' },
  { label: 'pow', detail: '幂运算', info: 'pow(x, y[, z]) - 返回x的y次幂' },
  { label: 'int', detail: '转整数', info: 'int(x) - 将x转换为整数' },
  { label: 'float', detail: '转浮点', info: 'float(x) - 将x转换为浮点数' },
  { label: 'str', detail: '转字符串', info: 'str(obj) - 将obj转换为字符串' }
]

/**
 * 格式化变量引用
 * participantId.dataset.columnName
 */
function formatVariableRef(participantId: string, dataset: string, columnName: string): string {
  return `${participantId}.${dataset}.${columnName}`
}

/**
 * 创建字段补全选项
 */
function createFieldCompletions(fields: CompletionField[]): Completion[] {
  return fields.map(field => {
    const ref = formatVariableRef(field.participantId, field.dataset, field.name)
    const originalFieldInfo = field.columnName && field.columnName !== field.name
      ? ` | 原始字段: ${field.columnName}`
      : ''
    return {
      label: ref,
      type: 'variable',
      detail: `${field.participantId} / ${field.dataset}`,
      info: field.dataType ? `字段类型: ${field.dataType}${originalFieldInfo}` : `数据字段${originalFieldInfo}`,
      boost: field.columnName && field.columnName !== field.name ? 1 : 0  // 优先显示有别名的字段
    } as Completion
  })
}

/**
 * 自定义补全源
 */
function createCompletionSource(fields: CompletionField[]) {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/\w*\.?\w*/)
    if (!word || (word.from === word.to && !context.explicit)) {
      return null
    }

    const currentLine = context.state.doc.lineAt(word.from)

    // 获取当前行的文本，用于检查是否在点号后面
    const textUpToCursor = currentLine.text.substring(0, word.from - currentLine.from)

    // 检测函数调用场景 - 函数参数智能补全
    const functionMatch = textUpToCursor.match(/(\w+)\(\s*([^)]*)$/)
    if (functionMatch && functionMatch[1]) {
      const functionName = functionMatch[1].toLowerCase()
      // 聚合函数优先显示数字类型字段
      if (['sum', 'avg', 'min', 'max', 'mean', 'median'].includes(functionName)) {
        const numericFields = fields.filter(f =>
          f.dataType?.match(/int|float|double|decimal|bigint|number/i)
        )
        if (numericFields.length > 0) {
          return {
            from: word.from,
            options: createFieldCompletions(numericFields)
          }
        }
      }
      // 字符串函数优先显示字符串类型字段
      if (['len', 'upper', 'lower', 'trim', 'concat', 'substring'].includes(functionName)) {
        const stringFields = fields.filter(f =>
          f.dataType?.match(/str|varchar|char|text|string/i)
        )
        if (stringFields.length > 0) {
          return {
            from: word.from,
            options: createFieldCompletions(stringFields)
          }
        }
      }
      // 其他函数显示所有字段
      if (word.text.length > 0) {
        const matchedFields = fields.filter(f =>
          f.name.toLowerCase().startsWith(word.text.toLowerCase())
        )
        if (matchedFields.length > 0) {
          return {
            from: word.from,
            options: createFieldCompletions(matchedFields)
          }
        }
      }
    }

    // 检查是否在输入点号后的补全
    // 构建完整的输入文本（包含当前 word）
    const fullText = textUpToCursor + word.text

    // 使用 [\w\u4e00-\u9fa5]+ 支持中文字符
    const dotMatch = fullText.match(/([\w\u4e00-\u9fa5]+)\.([\w\u4e00-\u9fa5]*)\.([\w\u4e00-\u9fa5]*)$/)

    if (dotMatch) {
      // participantId.dataset.columnName 模式
      const participantId = dotMatch[1]
      const dataset = dotMatch[2]
      const columnNamePart = dotMatch[3]

      // 过滤匹配的字段
      let matchedFields = fields.filter(f =>
        f.participantId === participantId &&
        f.dataset === dataset
      )

      // 如果已经开始输入字段名，进一步过滤
      if (columnNamePart && word.text !== '.') {
        const searchName = word.text.replace(/\.$/, '') || columnNamePart
        matchedFields = matchedFields.filter(f =>
          f.name.toLowerCase().startsWith(searchName.toLowerCase())
        )
      }

      if (matchedFields.length > 0) {
        return {
          from: word.from,
          options: createFieldCompletions(matchedFields)
        }
      }
    } else if (fullText.includes('.')) {
      // 检查几种情况：
      // 1. participantId. - 显示该参与者的数据集列表
      // 2. participantId.dataset. - 显示该数据集的字段列表
      // 3. participantId.dataset.fieldName - 继续字段名补全

      // 使用正则匹配各种模式
      const singleDotMatch = fullText.match(/^([\w\u4e00-\u9fa5]+)\.$/)
      if (singleDotMatch) {
        // 情况1: participantId. - 显示数据集
        const participantId = singleDotMatch[1]

        const datasets = [...new Set(fields.filter(f => f.participantId === participantId).map(f => f.dataset))]
        if (datasets.length > 0) {
          // 在点号后面插入数据集名，不替换已有内容
          const insertPos = word.to  // 点号之后的位置
          return {
            from: insertPos,
            to: insertPos,
            options: datasets.map(ds => ({
              label: ds,
              type: 'namespace',
              detail: '数据集',
              info: `${participantId} 的 ${ds} 数据集`,
              apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
                view.dispatch({
                  changes: { from, to, insert: `${ds}.` },
                  selection: EditorSelection.cursor(from + ds.length + 1)
                })
              }
            } as Completion))
          }
        }
      }

      const parts = fullText.split('.')
      if (parts.length === 2 && parts[1] !== '') {
        // 情况2: participantId.dataset - 显示字段列表（正在输入字段名）
        const [participantId, dataset] = parts

        let matchedFields = fields.filter(f =>
          f.participantId === participantId &&
          f.dataset === dataset
        )

        // 如果已经开始输入字段名，进一步过滤
        if (word.text && word.text !== '.') {
          matchedFields = matchedFields.filter(f =>
            f.name.toLowerCase().startsWith(word.text.toLowerCase())
          )
        }

        if (matchedFields.length > 0) {
          return {
            from: word.from,
            options: createFieldCompletions(matchedFields)
          }
        }
      }

      // 情况3: participantId.dataset.fieldName - 继续字段名补全
      const tripleDotMatch = fullText.match(/^([\w\u4e00-\u9fa5]+)\.([\w\u4e00-\u9fa5]+)\.([\w\u4e00-\u9fa5]*)$/)
      if (tripleDotMatch) {
        const participantId = tripleDotMatch[1]
        const dataset = tripleDotMatch[2]
        const fieldNamePart = tripleDotMatch[3]

        let matchedFields = fields.filter(f =>
          f.participantId === participantId &&
          f.dataset === dataset
        )

        if (fieldNamePart) {
          matchedFields = matchedFields.filter(f =>
            f.name.toLowerCase().startsWith(fieldNamePart.toLowerCase())
          )
        }

        if (matchedFields.length > 0) {
          return {
            from: word.from,
            options: createFieldCompletions(matchedFields)
          }
        }
      }
    } else {
      // 顶层补全：参与者、函数、关键字
      const options: Completion[] = []

      // 添加字段引用（participantId.dataset 开头）
      const uniqueParticipants = [...new Set(fields.map(f => f.participantId))]
      uniqueParticipants.forEach(pid => {
        const datasets = [...new Set(fields.filter(f => f.participantId === pid).map(f => f.dataset))]
        datasets.forEach(ds => {
          options.push({
            label: `${pid}.${ds}.`,
            type: 'namespace',
            detail: '数据源',
            info: `${pid} 的 ${ds} 数据集`,
            apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
              view.dispatch({
                changes: { from, to, insert: `${pid}.${ds}.` },
                selection: EditorSelection.cursor(from + `${pid}.${ds}.`.length)
              })
            }
          })
        })
      })

      // 添加 Python 函数
      pythonFunctions.forEach(fn => {
        if (fn.label.toLowerCase().startsWith(word.text.toLowerCase())) {
          options.push(fn)
        }
      })

      // 添加关键字
      pythonKeywords.forEach(kw => {
        if (kw.toLowerCase().startsWith(word.text.toLowerCase())) {
          options.push({
            label: kw,
            type: 'keyword',
            detail: 'Python 关键字'
          })
        }
      })

      if (options.length > 0) {
        return {
          from: word.from,
          options
        }
      }
    }

    return null
  }
}

/**
 * 创建编辑器扩展
 */
function createExtensions(): Extension[] {
  // 获取可用字段
  const fields = props.availableFields || []

  return [
    EditorView.theme({
      '&': {
        fontSize: '14px',
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace"
      },
      '.cm-scroller': {
        overflow: 'auto'
      },
      '.cm-content': {
        padding: '16px 0',
        minHeight: '300px'
      }
    }),
    EditorView.lineWrapping,
    keymap.of([
      ...defaultKeymap,
      indentWithTab,
      ...searchKeymap
    ]),
    autocompletion({
      override: [createCompletionSource(fields)],
      activateOnTyping: true,
      maxRenderedOptions: 20
    }),
    bracketMatching(),
    highlightSelectionMatches(),
    placeholderExt('# 在此输入 Python 表达式...\n# 示例: companyA.salary * 0.8 + companyB.bonus'),
    languageCompartment.of(python()),
    themeCompartment.of(oneDark)
  ]
}

/**
 * 处理字段拖拽开始
 */
function handleFieldDragStart(_payload: { fullRef: string; field: any }) {
  // 拖拽数据已经在 FieldGroupCard 中设置
  // 这里只是通知，实际处理在 drop 事件中
}

/**
 * 初始化 CodeMirror Editor
 */
async function initEditor() {
  if (!editorContainer.value) return

  await nextTick()

  // 销毁已存在的 editor
  if (editorView) {
    editorView.destroy()
  }

  // 创建拖拽处理器 - 使用 domEventHandlers
  const dropHandlerExtension = EditorView.domEventHandlers({
    drop: (event: DragEvent) => {
      if (!event.dataTransfer) return false
      const dragData = event.dataTransfer.getData('application/json')
      if (!dragData) return false

      try {
        const { fullRef } = JSON.parse(dragData)
        if (!editorView) return false

        const pos = editorView.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos === null) return false

        editorView.dispatch({
          changes: { from: pos, to: pos, insert: fullRef },
          selection: EditorSelection.cursor(pos + fullRef.length)
        })

        expression.value = editorView.state.doc.toString()
        event.preventDefault()
        return true
      } catch {
        return false
      }
    },
    dragover: (event: DragEvent) => {
      event.preventDefault()
      return true
    },
    dragenter: (event: DragEvent) => {
      event.preventDefault()
      return true
    }
  })

  // 创建 editor
  const state = EditorState.create({
    doc: expression.value,
    extensions: [
      ...createExtensions(),
      dropHandlerExtension,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          expression.value = update.state.doc.toString()
          validateExpression()
        }
      }),
      // 确保编辑器可编辑和可聚焦
      EditorView.editable.of(true),
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
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
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // 对话框打开时初始化 editor
    expression.value = props.initialExpression || ''
    // 使用 nextTick 确保 DOM 已更新
    await nextTick()
    await nextTick() // 双重 nextTick 确保 Transition 动画完成
    await initEditor()
  } else {
    // 对话框关闭时销毁 editor
    if (editorView) {
      editorView.destroy()
      editorView = null
    }
  }
})

// 监听可用字段变化，重新初始化编辑器以更新补全
watch(() => props.availableFields, () => {
  if (props.modelValue && editorContainer.value) {
    // 如果对话框打开中，重新初始化编辑器
    initEditor()
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (editorView) {
    editorView.destroy()
  }
})
</script>

<style scoped lang="scss">
// 使用 :deep() 确保过渡样式正确应用到 Transition 组件
:deep(.modal-enter-active),
:deep(.modal-leave-active) {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s ease;
  }
}

:deep(.modal-enter-from),
:deep(.modal-leave-to) {
  opacity: 0;

  .modal-content {
    transform: scale(0.9);
  }
}

:deep(.modal-enter-to),
:deep(.modal-leave-from) {
  opacity: 1;

  .modal-content {
    transform: scale(1);
  }
}

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
  min-height: 0; // 允许 flex 子元素正确收缩
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

.expression-editor-container {
  flex: 1;
  display: flex;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  min-width: 0;
}

.editor-container {
  height: 100%;
  min-height: 250px;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  // CodeMirror 样式覆盖
  :deep(.cm-editor) {
    height: 100% !important;

    &.cm-focused {
      outline: none;
    }

    .cm-scroller {
      overflow: auto;
      height: 100%;
    }

    .cm-content {
      padding: 16px;
      min-height: 100%;
    }

    .cm-line {
      padding: 0 4px;
    }

    // 确保编辑区域可见
    .cm-contentWrapper {
      min-height: 100%;
    }
  }
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
</style>
