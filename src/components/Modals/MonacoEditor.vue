<template>
  <div ref="editorContainer" class="monaco-editor-container" :style="{ height: height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

interface Props {
  modelValue?: string
  language?: string
  readonly?: boolean
  height?: string
  options?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'python',
  readonly: false,
  height: '300px',
  options: () => ({})
})

const emit = defineEmits<Emits>()

const editorContainer = ref<HTMLElement>()
let editor: any = null

// 初始化 Monaco Editor
onMounted(async () => {
  if (!editorContainer.value) return

  let monaco: any

  // 开发环境：使用 npm 包（Vite 处理）
  // 生产环境：使用 CDN（构建时 external）
  if (import.meta.env.DEV) {
    // 开发环境 - 从 npm 包动态导入
    monaco = (await import('monaco-editor')).default
    createEditor(monaco)
  } else {
    // 生产环境 - 从 CDN 加载
    const require = (window as any).require

    if (!require) {
      console.error('Monaco Editor loader not found. Please check index.html')
      return
    }

    // 配置 Monaco Editor
    require.config({
      paths: {
        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
      }
    })

    // 加载 Monaco Editor
    require(['vs/editor/editor.main'], (monacoInstance: any) => {
      createEditor(monacoInstance)
    })
  }
})

function createEditor(monaco: any) {
  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value!, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readonly,
    theme: 'vs',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
    padding: { top: 16, bottom: 16 },
    suggest: {
      showKeywords: false,
      showSnippets: false
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    parameterHints: {
      enabled: true
    },
    ...props.options
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    emit('update:modelValue', value)
  })

  // 监听语言变化
  watch(() => props.language, (newLang) => {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLang)
    }
  })
}

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    const position = editor.getPosition()
    editor.setValue(newValue)
    if (position) {
      editor.setPosition(position)
    }
  }
})

// 监听只读状态变化
watch(() => props.readonly, (newValue) => {
  if (editor) {
    editor.updateOptions({ readOnly: newValue })
  }
})

// 暴露编辑器实例
defineExpose({
  editor,
  focus: () => editor?.focus(),
  getValue: () => editor?.getValue() || '',
  setValue: (value: string) => editor?.setValue(value),
  getSelection: () => editor?.getSelection()
})
</script>

<style scoped lang="scss">
.monaco-editor-container {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;

  &:focus-within {
    border-color: #13C2C2;
    box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
  }
}
</style>
