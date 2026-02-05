<template>
  <div class="param-progress">
    <div class="progress-header">
      <span
        class="status-badge"
        :class="`status-${progressInfo.status}`"
      >
        {{ statusLabel }}
      </span>
      <span class="progress-percentage">{{ progressInfo.percentage }}%</span>
    </div>

    <div class="progress-bar-container">
      <div
        class="progress-bar"
        :style="{ width: `${progressInfo.percentage}%` }"
      />
    </div>

    <div class="progress-summary">
      <span>{{ progressInfo.configuredCount }}/{{ progressInfo.totalCount }} 个参数已配置</span>
      <span v-if="progressInfo.requiredMissing > 0" class="required-missing">
        | {{ progressInfo.requiredMissing }} 个必填未配置
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ParamProgressInfo } from '@/utils/model-config-utils'

interface Props {
  progressInfo: ParamProgressInfo
}

const props = defineProps<Props>()

// 状态标签文本
const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    'unconfigured': '未配置',
    'partial': '部分配置',
    'complete': '已配置'
  }
  return labels[props.progressInfo.status] || '未知'
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.param-progress {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.status-unconfigured {
    background: linear-gradient(135deg, rgba(140, 140, 140, 0.1), rgba(140, 140, 140, 0.15));
    color: var(--param-status-unconfigured);
    border: 1px solid rgba(140, 140, 140, 0.2);
  }

  &.status-partial {
    background: linear-gradient(135deg, rgba(250, 140, 22, 0.1), rgba(250, 140, 22, 0.15));
    color: var(--param-status-partial);
    border: 1px solid rgba(250, 140, 22, 0.2);
  }

  &.status-complete {
    background: linear-gradient(135deg, rgba(82, 196, 26, 0.1), rgba(82, 196, 26, 0.15));
    color: var(--param-status-complete);
    border: 1px solid rgba(82, 196, 26, 0.2);
  }
}

.progress-percentage {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: var(--param-progress-bg);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg,
    var(--param-progress-bar-start) 0%,
    var(--param-progress-bar-end) 100%
  );
  border-radius: 3px;
  transition: width var(--transition-base) var(--easing-smooth);
  position: relative;

  // 添加光亮效果
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-summary {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;

  .required-missing {
    color: var(--param-status-partial);
    font-weight: 500;
  }
}
</style>
