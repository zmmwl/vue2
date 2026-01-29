<template>
  <div ref="editorContainer" class="monaco-editor-container" :style="{ height: height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

interface Props {
  modelValue?: string
  language?: string
  readonly?: boolean
  height?: string
  options?: monaco.editor.IStandaloneEditorConstructionOptions
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
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return

  // 创建编辑器
  editor = monaco.editor.create(editorContainer.value, {
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
})

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
