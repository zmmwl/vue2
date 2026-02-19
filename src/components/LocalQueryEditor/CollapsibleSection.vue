<template>
  <div class="collapsible-section">
    <div class="section-header" @click="toggleCollapse">
      <div class="header-left">
        <span class="collapse-icon">{{ isExpanded ? '▼' : '▶' }}</span>
        <span class="section-title">{{ title }}</span>
        <span v-if="count !== undefined" class="section-count">({{ count }})</span>
      </div>
      <div v-if="$slots.headerActions" class="header-actions" @click.stop>
        <slot name="headerActions"></slot>
      </div>
    </div>
    <Transition name="collapse">
      <div v-show="isExpanded" class="section-content">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  title: string
  count?: number
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: true
})

const isExpanded = ref(props.defaultExpanded)

watch(() => props.defaultExpanded, (newVal) => {
  isExpanded.value = newVal
})

function toggleCollapse() {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.collapsible-section {
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--info-card-border);
  border-radius: var(--info-card-radius);
  overflow: hidden;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s;
  width: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-count {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding: 0 16px 16px 16px;
}

// Collapse transition
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
