<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { BaseEdge, getSmoothStepPath, getBezierPath, type EdgeProps, type Node } from '@vue-flow/core'

const props = defineProps<EdgeProps>()

// 从 Vue Flow 注入所有节点（用于智能路由和类型判断）
const nodes = inject<Ref<Node[]>>('nodes')

// 默认连线颜色
const EDGE_COLOR = '#B8B8B8'
const SELECTED_COLOR = '#1890ff'

// 默认节点尺寸（用于碰撞检测）
const DEFAULT_NODE_WIDTH = 200
const DEFAULT_NODE_HEIGHT = 100

/**
 * 获取节点的宽高
 */
function getNodeDimensions(node: Node): { width: number; height: number } {
  const nodeData = node.data as { width?: number; height?: number } | undefined
  return {
    width: nodeData?.width || DEFAULT_NODE_WIDTH,
    height: nodeData?.height || DEFAULT_NODE_HEIGHT
  }
}

/**
 * 检测点是否在矩形内
 */
function isPointInRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/**
 * 检测线段是否与矩形相交
 */
function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  // 检测线段的两个端点是否在矩形内
  if (isPointInRect(x1, y1, rect) || isPointInRect(x2, y2, rect)) {
    return true
  }

  // 检测线段是否穿过矩形中心区域
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  if (isPointInRect(midX, midY, rect)) {
    return true
  }

  // 检测多个采样点
  for (let t = 0.2; t <= 0.8; t += 0.2) {
    const px = x1 + (x2 - x1) * t
    const py = y1 + (y2 - y1) * t
    if (isPointInRect(px, py, rect)) {
      return true
    }
  }

  return false
}

/**
 * 获取路径穿过的节点（排除源节点和目标节点）
 */
function getIntersectingNodes(
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  nodeList: Node[] | undefined,
  sourceId: string,
  targetId: string
): Node[] {
  if (!nodeList) return []

  return nodeList.filter(node => {
    if (node.id === sourceId || node.id === targetId) return false

    const { width, height } = getNodeDimensions(node)
    const rect = {
      x: node.position.x,
      y: node.position.y,
      width,
      height
    }

    return lineIntersectsRect(sourceX, sourceY, targetX, targetY, rect)
  })
}

/**
 * 计算智能路径偏移量（用于避开节点）
 */
function calculateOffset(
  sourceY: number,
  targetY: number,
  intersectingNodes: Node[]
): number {
  if (intersectingNodes.length === 0) return 0

  const baseOffset = 50
  let offsetSum = 0

  for (const node of intersectingNodes) {
    const { height } = getNodeDimensions(node)
    const nodeCenterY = node.position.y + height / 2
    const lineMidY = (sourceY + targetY) / 2

    if (nodeCenterY < lineMidY) {
      offsetSum += baseOffset
    } else {
      offsetSum -= baseOffset
    }
  }

  return offsetSum
}

/**
 * 判断是否使用圆角折线
 * 源节点是 model 或 computeResource 时使用圆角折线
 */
function shouldUseSmoothStep(nodeList: Node[] | undefined, sourceId: string): boolean {
  if (!nodeList) return false

  const sourceNode = nodeList.find(n => n.id === sourceId)
  if (!sourceNode) return false

  const category = (sourceNode.data as { category?: string })?.category
  return category === 'model' || category === 'computeResource'
}

/**
 * 提取路径字符串
 */
function extractPath(pathResult: string | [string, number, number, number, number]): string {
  return typeof pathResult === 'string' ? pathResult : pathResult[0]
}

// 计算路径（根据源节点类型选择路径类型）
const path = computed(() => {
  const useSmoothStep = shouldUseSmoothStep(nodes?.value, props.source)

  if (useSmoothStep) {
    // 圆角折线 + 智能路由
    const intersectingNodes = getIntersectingNodes(
      props.sourceX, props.sourceY,
      props.targetX, props.targetY,
      nodes?.value,
      props.source,
      props.target
    )

    const offset = calculateOffset(props.sourceY, props.targetY, intersectingNodes)

    return extractPath(getSmoothStepPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      sourcePosition: props.sourcePosition,
      targetX: props.targetX,
      targetY: props.targetY,
      targetPosition: props.targetPosition,
      borderRadius: 8,
      offset: offset || undefined
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
