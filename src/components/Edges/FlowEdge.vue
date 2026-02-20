<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, getSmoothStepPath, getBezierPath, type EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

// 默认连线颜色
const EDGE_COLOR = '#B8B8B8'
const SELECTED_COLOR = '#1890ff'

/**
 * 判断是否使用圆角折线
 * 源节点是 model 或 computeResource 时使用圆角折线
 */
function shouldUseSmoothStep(sourceCategory: string | undefined): boolean {
  return sourceCategory === 'model' || sourceCategory === 'computeResource'
}

/**
 * 提取路径字符串
 */
function extractPath(pathResult: string | [string, number, number, number, number]): string {
  return typeof pathResult === 'string' ? pathResult : pathResult[0]
}

// 计算路径（根据源节点类型选择路径类型）
const path = computed(() => {
  const sourceCategory = (props.data as { sourceCategory?: string })?.sourceCategory
  const useSmoothStep = shouldUseSmoothStep(sourceCategory)

  if (useSmoothStep) {
    // 圆角折线
    return extractPath(getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
      borderRadius: 8
    }))
  } else {
    // 贝塞尔曲线
    return extractPath(getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
      curvature: 0.5
    }))
  }
})

// 箭头 ID（唯一）
const arrowId = computed(() => `edge-arrow-${props.id}`)

// 当前颜色
const currentColor = computed(() => props.selected ? SELECTED_COLOR : EDGE_COLOR)
</script>

<template>
  <g class="flow-edge">
    <!-- 定义箭头和滤镜 -->
    <defs>
      <!-- 自定义箭头标记 -->
      <marker
        :id="arrowId"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M 0 0 L 10 5 L 0 10 z"
          :fill="currentColor"
        />
      </marker>

      <!-- 发光滤镜（选中时使用） -->
      <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- 透明交互区域（扩大悬停范围） -->
    <path
      :d="path"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="edge-interaction"
    />

    <!-- 阴影层（增加层次感） -->
    <path
      :d="path"
      fill="none"
      stroke="rgba(0,0,0,0.08)"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="edge-shadow"
    />

    <!-- 主连线 -->
    <BaseEdge
      :id="id"
      :path="path"
      :marker-end="`url(#${arrowId})`"
      :style="{
        stroke: currentColor,
        strokeWidth: selected ? 2.5 : 2,
        filter: selected ? 'url(#edge-glow)' : 'none',
        transition: 'stroke 0.2s ease, stroke-width 0.2s ease'
      }"
      class="edge-path"
    />

    <!-- 单光点流动效果 -->
    <circle
      v-if="!selected"
      r="3"
      fill="#1890ff"
      stroke="#fff"
      stroke-width="1"
      style="filter: drop-shadow(0 0 3px rgba(24, 144, 255, 0.6))"
      class="edge-particle"
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
  pointer-events: auto;
  cursor: pointer;
}

.edge-interaction {
  pointer-events: stroke;
  cursor: pointer;
}

.edge-shadow,
.edge-particle {
  pointer-events: none;
}

.flow-edge:hover :deep(path.edge-path) {
  stroke: #1890ff !important;
  stroke-width: 2.5px;
}

/* 悬停时增强阴影 */
.flow-edge:hover .edge-shadow {
  stroke: rgba(24, 144, 255, 0.15);
}
</style>
