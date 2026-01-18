<template>
  <div class="flow-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.3"
      :max-zoom="2"
      :fit-view-on-init="false"
      :default-edge-options="{ type: 'smoothstep', style: { stroke: '#999999', strokeWidth: 1.5 } }"
      :delete-key-code="'Delete'"
      @connect="onConnect"
      @edges-change="onEdgesChange"
      @nodes-change="onNodesChange"
    >
      <Background pattern="dots" :gap="20" :size="1.5" color="#d1d5db" />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, Connection, EdgeChange, NodeChange } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import DataSourceNode from '@/components/Nodes/DataSourceNode.vue'
import ComputeTaskNode from '@/components/Nodes/ComputeTaskNode.vue'
import FlowEdge from '@/components/Edges/FlowEdge.vue'
import { createUniqueEdge } from '@/utils/edge-utils'

// 获取坐标投影函数（将屏幕坐标转换为画布坐标）
const { project } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode)
}

// 注册自定义连接线类型
const edgeTypes = {
  default: markRaw(FlowEdge)
}

// 节点和连接线数据
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

/**
 * 处理连接事件
 * 所有连接都使用固定的 handle ID：
 * - 数据源/任务节点的输出: "output"
 * - 任务节点的输入: "input"
 */
const onConnect = (connection: Connection) => {
  // 创建连接 - 使用固定的 handle ID
  const newEdge = createUniqueEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(newEdge)
}

/**
 * 处理节点变化（删除等）
 * 删除节点时，自动删除所有连接到该节点的连接线
 */
const onNodesChange = (changes: NodeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      // 删除所有与该节点相关的连接线
      edges.value = edges.value.filter(
        edge => edge.source !== change.id && edge.target !== change.id
      )
    }
  }
}

/**
 * 处理连接线变化（删除等）
 */
const onEdgesChange = (_changes: EdgeChange[]) => {
  // 固定 handle 系统不需要在删除 edge 时做额外处理
}

/**
 * 处理拖放事件 - 拖拽经过
 */
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

/**
 * 处理拖放事件 - 放置节点
 */
const onDrop = (event: DragEvent) => {
  const rawData = event.dataTransfer?.getData('application/vueflow')
  if (!rawData) return

  try {
    const data: DroppedNodeData = JSON.parse(rawData)

    // 计算节点位置（基于鼠标位置，将鼠标点作为节点中心）
    // 需要考虑画布的缩放和平移，将屏幕坐标转换为画布坐标
    const projected = project({
      x: event.offsetX,
      y: event.offsetY
    })

    // 减去节点宽高的一半使鼠标点成为节点中心
    const position = {
      x: projected.x - 100,  // 节点宽度约 200px
      y: projected.y - 30    // 节点高度约 60px
    }

    // 创建新节点
    const newNode: Node = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      position,
      data: {
        label: data.label,
        category: data.category,
        taskType: data.taskType,
        sourceType: data.sourceType,
        icon: data.icon,
        color: data.color,
        description: data.description
      }
    }

    nodes.value.push(newNode)
  } catch (error) {
    console.error('Failed to parse dropped data:', error)
  }
}
</script>

<style scoped lang="scss">
.flow-canvas {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

// n8n 风格控制按钮样式
:deep(.vue-flow__controls) {
  button {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    color: #666666;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    &:hover {
      background-color: #f5f5f5;
      border-color: #1890ff;
      color: #1890ff;
    }

    &:active {
      background-color: #e6e6e6;
    }
  }
}

// n8n 风格连接线样式
:deep(.vue-flow__edge-path) {
  stroke: #999999;
  stroke-width: 1.5;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #1890ff;
}

// n8n 风格选中节点样式
:deep(.vue-flow__node.selected) {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
</style>
