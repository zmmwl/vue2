<template>
  <div class="flow-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.3"
      :max-zoom="2"
      :fit-view-on-init="false"
      :default-edge-options="{ type: 'smoothstep', style: { stroke: '#999999', strokeWidth: 1.5 } }"
      @connect="onConnect"
    >
      <Background pattern="dots" :gap="20" :size="1.5" color="#d1d5db" />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Node, Edge, Connection } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import DataSourceNode from '@/components/Nodes/DataSourceNode.vue'
import ComputeTaskNode from '@/components/Nodes/ComputeTaskNode.vue'
import { createUniqueEdge } from '@/utils/edge-utils'

// 注册自定义节点类型
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode)
}

// 节点和连接线数据
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

/**
 * 处理连接事件
 */
const onConnect = (connection: Connection) => {
  const newEdge = createUniqueEdge(connection, edges.value)
  edges.value.push(newEdge)

  // 如果目标是任务节点，为其创建新的附着端点
  const targetNode = nodes.value.find(n => n.id === connection.target)
  if (targetNode?.type === 'compute_task') {
    const endpointId = `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (!targetNode.data.attachmentEndpoints) {
      targetNode.data.attachmentEndpoints = []
    }

    targetNode.data.attachmentEndpoints.push({
      id: endpointId,
      label: `输入 ${targetNode.data.attachmentEndpoints.length + 1}`
    })

    // 触发节点更新
    nodes.value = [...nodes.value]
  }
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

    // 计算节点位置（基于鼠标位置）
    const position = {
      x: event.offsetX,
      y: event.offsetY
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

// n8n 风格连接点样式
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background-color: #999999;
  border: 2px solid #ffffff;

  &:hover {
    background-color: #1890ff;
  }
}

// n8n 风格选中节点样式
:deep(.vue-flow__node.selected) {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
</style>
