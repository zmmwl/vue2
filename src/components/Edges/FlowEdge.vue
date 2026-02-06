<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, getBezierPath, type EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

const path = computed(() =>
  getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition
  })
)
</script>

<template>
  <g class="flow-edge">
    <!-- 主连接线 - 增加透明填充区域以扩大点击范围 -->
    <BaseEdge
      :id="id"
      :path="path[0]"
      :marker-end="markerEnd"
      :style="{
        stroke: selected ? '#1890ff' : '#999999',
        strokeWidth: 2,
        pointerEvents: 'stroke',
        cursor: 'pointer'
      }"
      class="edge-path"
    />

    <!-- 流动的光点粒子 -->
    <circle
      v-if="!selected"
      r="3"
      fill="#1890ff"
      stroke="#ffffff"
      stroke-width="1"
      style="filter: drop-shadow(0 0 3px rgba(24, 144, 255, 0.6))"
    >
      <animateMotion
        dur="1.5s"
        repeatCount="indefinite"
      >
        <mpath :href="`#${id}`" />
      </animateMotion>
    </circle>
  </g>
</template>

<style scoped>
.flow-edge {
  /* 启用连接线的交互，支持选择和删除 */
  pointer-events: auto;
  cursor: pointer;
}

.flow-edge:hover :deep(path) {
  stroke: #1890ff;
  stroke-width: 3;
}
</style>
