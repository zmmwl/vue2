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
      @edges-change="onEdgesChange"
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
import type { Node, Edge, Connection, EdgeChange } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import type { InputHandle, OutputHandle } from '@/types/nodes'
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
 * 为节点创建新的输出 handle
 */
const createOutputHandle = (node: Node) => {
  if (!node.data.outputHandles) {
    node.data.outputHandles = []
  }

  const currentCount = node.data.outputHandles.length
  const newCount = currentCount + 1
  const margin = 15
  const availableWidth = 100 - (margin * 2)

  const handleId = `output_${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  node.data.outputHandles.push({
    id: handleId,
    position: 0
  })

  // 重新计算所有输出 handle 的位置
  node.data.outputHandles.forEach((_, index) => {
    if (newCount === 1) {
      node.data.outputHandles![index].position = 50
    } else {
      const step = availableWidth / (newCount - 1)
      node.data.outputHandles![index].position = Math.round(margin + (step * index))
    }
  })

  return handleId
}

/**
 * 为节点创建新的输入 handle
 */
const createInputHandle = (node: Node) => {
  if (!node.data.inputHandles) {
    node.data.inputHandles = []
  }

  const currentCount = node.data.inputHandles.length
  const newCount = currentCount + 1
  const margin = 15
  const availableWidth = 100 - (margin * 2)

  const handleId = `input_${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  node.data.inputHandles.push({
    id: handleId,
    position: 0
  })

  // 重新计算所有输入 handle 的位置
  node.data.inputHandles.forEach((_, index) => {
    if (newCount === 1) {
      node.data.inputHandles![index].position = 50
    } else {
      const step = availableWidth / (newCount - 1)
      node.data.inputHandles![index].position = Math.round(margin + (step * index))
    }
  })

  return handleId
}

/**
 * 处理连接事件
 */
const onConnect = (connection: Connection) => {
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) return

  // 为源节点创建输出 handle
  const sourceHandleId = createOutputHandle(sourceNode)

  // 为目标节点创建输入 handle
  const targetHandleId = createInputHandle(targetNode)

  // 触发节点更新
  nodes.value = [...nodes.value]

  // 创建连接
  const newEdge = createUniqueEdge(
    {
      ...connection,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId
    },
    edges.value
  )
  edges.value.push(newEdge)
}

/**
 * 处理连接线变化（删除等）
 */
const onEdgesChange = (changes: EdgeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      // 查找被删除的 edge
      const removedEdge = edges.value.find(e => e.id === change.id)
      if (!removedEdge) continue

      // 处理源节点的输出 handle
      if (removedEdge.sourceHandle) {
        const sourceNode = nodes.value.find(n => n.id === removedEdge.source)
        if (sourceNode?.data.outputHandles) {
          const handleIndex = sourceNode.data.outputHandles.findIndex(
            h => h.id === removedEdge.sourceHandle
          )
          if (handleIndex !== -1) {
            sourceNode.data.outputHandles.splice(handleIndex, 1)

            // 重新计算剩余 handle 的位置
            if (sourceNode.data.outputHandles.length > 0) {
              recalcHandlePositions(sourceNode.data.outputHandles)
            }

            nodes.value = [...nodes.value]
          }
        }
      }

      // 处理目标节点的输入 handle
      if (removedEdge.targetHandle) {
        const targetNode = nodes.value.find(n => n.id === removedEdge.target)
        if (targetNode?.data.inputHandles) {
          const handleIndex = targetNode.data.inputHandles.findIndex(
            h => h.id === removedEdge.targetHandle
          )
          if (handleIndex !== -1) {
            targetNode.data.inputHandles.splice(handleIndex, 1)

            // 重新计算剩余 handle 的位置
            if (targetNode.data.inputHandles.length > 0) {
              recalcHandlePositions(targetNode.data.inputHandles)
            }

            nodes.value = [...nodes.value]
          }
        }
      }
    }
  }
}

/**
 * 重新计算 handle 位置
 */
const recalcHandlePositions = (handles: InputHandle[] | OutputHandle[]) => {
  const count = handles.length
  const margin = 15
  const availableWidth = 100 - (margin * 2)

  handles.forEach((_, index) => {
    if (count === 1) {
      handles[index].position = 50
    } else {
      const step = availableWidth / (count - 1)
      handles[index].position = Math.round(margin + (step * index))
    }
  })
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

// n8n 风格选中节点样式
:deep(.vue-flow__node.selected) {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
</style>
