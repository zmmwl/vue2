<template>
  <div class="collapsible-section">
    <div class="section-header" @click="toggle">
      <h4 class="section-title">
        {{ title }}
        <span v-if="count !== undefined" class="section-count">({{ count }})</span>
      </h4>
      <div class="toggle-icon" :class="{ 'is-expanded': isExpanded }">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div v-show="isExpanded" class="section-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  count?: number
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: true
})

const isExpanded = ref(props.defaultExpanded)

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped lang="scss">
.collapsible-section {
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-base) var(--easing-smooth);
  user-select: none;

  &:hover {
    background: rgba(14, 165, 233, 0.05);
    border-color: rgba(14, 165, 233, 0.15);
  }
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;

  .section-count {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-secondary);
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.toggle-icon {
  color: var(--text-secondary);
  transition: transform var(--transition-base) var(--easing-smooth);

  &.is-expanded {
    transform: rotate(180deg);
  }
}

.section-content {
  padding: 12px 0;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
