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
      @connect-start="onConnectStart"
      @connect-end="onConnectEnd"
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
 * 为节点创建新的输出 handle（圆形，底部）
 * 规则：50% -> 85% -> 15% -> 30% -> 70% -> 自动扩展节点宽度
 */
const createOutputHandle = (node: Node) => {
  if (!node.data.outputHandles) {
    node.data.outputHandles = []
  }

  const currentCount = node.data.outputHandles.length
  const handleId = `output_${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 按照固定顺序分配位置：50% -> 85% -> 15% -> 30% -> 70% -> ...
  const positionSequence = [50, 85, 15, 30, 70, 5, 95, 22, 78, 38, 62]
  const position = currentCount < positionSequence.length
    ? positionSequence[currentCount]
    : 15 + (currentCount * 8) // 超出预设序列时动态计算

  node.data.outputHandles.push({
    id: handleId,
    position
  })

  // 如果超过3个handle，扩展节点宽度
  if (currentCount >= 2) {
    const baseWidth = 240
    const extraWidth = (currentCount - 2) * 30
    node.style = {
      ...(node.style || {}),
      width: `${baseWidth + extraWidth}px`
    }
  }

  return handleId
}

/**
 * 为节点创建新的输入 handle（长方形，顶部）
 * 规则：50% -> 85% -> 15% -> 30% -> 70% -> 自动扩展节点宽度
 */
const createInputHandle = (node: Node) => {
  if (!node.data.inputHandles) {
    node.data.inputHandles = []
  }

  const currentCount = node.data.inputHandles.length
  const handleId = `input_${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 按照固定顺序分配位置：50% -> 85% -> 15% -> 30% -> 70% -> ...
  const positionSequence = [50, 85, 15, 30, 70, 5, 95, 22, 78, 38, 62]
  const position = currentCount < positionSequence.length
    ? positionSequence[currentCount]
    : 15 + (currentCount * 8) // 超出预设序列时动态计算

  node.data.inputHandles.push({
    id: handleId,
    position
  })

  // 如果超过3个handle，扩展节点宽度
  if (currentCount >= 2) {
    const baseWidth = 240
    const extraWidth = (currentCount - 2) * 30
    node.style = {
      ...(node.style || {}),
      width: `${baseWidth + extraWidth}px`
    }
  }

  return handleId
}

/**
 * 处理连接开始事件
 */
const onConnectStart = () => {
  // 连接开始时可以在这里添加逻辑
}

/**
 * 处理连接结束事件
 */
const onConnectEnd = () => {
  // 连接结束时可以在这里添加逻辑
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

  // 创建连接 - 使用新生成的 handle ID
  const newEdge = createUniqueEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: sourceHandleId,
    targetHandle: targetHandleId
  }, edges.value)
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
            (h: InputHandle | OutputHandle) => h.id === removedEdge.sourceHandle
          )
          if (handleIndex !== -1) {
            sourceNode.data.outputHandles.splice(handleIndex, 1)

            // 重新计算剩余 handle 的位置（按顺序重新分配）
            recalcHandlePositions(sourceNode.data.outputHandles)

            // 调整节点宽度
            adjustNodeWidth(sourceNode)

            nodes.value = [...nodes.value]
          }
        }
      }

      // 处理目标节点的输入 handle
      if (removedEdge.targetHandle) {
        const targetNode = nodes.value.find(n => n.id === removedEdge.target)
        if (targetNode?.data.inputHandles) {
          const handleIndex = targetNode.data.inputHandles.findIndex(
            (h: InputHandle | OutputHandle) => h.id === removedEdge.targetHandle
          )
          if (handleIndex !== -1) {
            targetNode.data.inputHandles.splice(handleIndex, 1)

            // 重新计算剩余 handle 的位置（按顺序重新分配）
            recalcHandlePositions(targetNode.data.inputHandles)

            // 调整节点宽度
            adjustNodeWidth(targetNode)

            nodes.value = [...nodes.value]
          }
        }
      }
    }
  }
}

/**
 * 重新计算 handle 位置（按固定顺序重新分配）
 */
const recalcHandlePositions = (handles: InputHandle[] | OutputHandle[]) => {
  const positionSequence = [50, 85, 15, 30, 70, 5, 95, 22, 78, 38, 62]

  handles.forEach((handle, index) => {
    if (index < positionSequence.length) {
      handle.position = positionSequence[index]!
    } else {
      handle.position = 15 + (index * 8)
    }
  })
}

/**
 * 根据句柄数量调整节点宽度
 */
const adjustNodeWidth = (node: Node) => {
  const handleCount = Math.max(
    node.data.inputHandles?.length || 0,
    node.data.outputHandles?.length || 0
  )

  if (handleCount > 3) {
    const baseWidth = 240
    const extraWidth = (handleCount - 3) * 30
    const currentStyle = typeof node.style === 'object' ? node.style : {}
    node.style = {
      ...currentStyle,
      width: `${baseWidth + extraWidth}px`
    } as any
  } else {
    // 移除宽度设置，恢复默认
    if (typeof node.style === 'object' && node.style && 'width' in node.style) {
      const newStyle = { ...node.style }
      delete (newStyle as any).width
      node.style = newStyle as any
    }
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

// n8n 风格选中节点样式
:deep(.vue-flow__node.selected) {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}
</style>
