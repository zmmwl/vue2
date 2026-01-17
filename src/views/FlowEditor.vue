<template>
  <div class="flow-editor">
    <FlowHeader />
    <div class="editor-content">
      <FlowSidebar />
      <FlowCanvas />
    </div>
  </div>
</template>

<script setup lang="ts">
import FlowHeader from '@/components/Flow/FlowHeader.vue'
import FlowSidebar from '@/components/Flow/FlowSidebar.vue'
import FlowCanvas from '@/components/Flow/FlowCanvas.vue'
</script>

<style scoped lang="scss">
.flow-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
