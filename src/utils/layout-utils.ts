import type { Node, Edge } from '@vue-flow/core'

// 布局配置
export interface LayoutOptions {
  nodeWidth?: number         // 节点宽度，默认 280
  nodeHeight?: number        // 节点高度，默认 120
  verticalSpacing?: number   // 垂直间距，默认 150
  horizontalSpacing?: number // 水平间距，默认 350
  sideNodeOffset?: number    // 侧边节点偏移量，默认 250
}

// 节点分类
type NodeCategory = 'dataSource' | 'computeTask' | 'output' | 'model' | 'computeResource' | 'localTask'

/**
 * 获取节点分类
 */
function getNodeCategory(node: Node): NodeCategory {
  const category = (node.data as { category?: string })?.category

  if (category === 'data_source') return 'dataSource'
  if (category === 'compute_task') return 'computeTask'
  if (category === 'outputData') return 'output'
  if (category === 'model') return 'model'
  if (category === 'computeResource') return 'computeResource'
  if (category === 'localTask') return 'localTask'

  return 'computeTask'
}

/**
 * 构建邻接表
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): {
  outgoing: Map<string, string[]>
  incoming: Map<string, string[]>
} {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()

  // 初始化
  nodes.forEach(node => {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
  })

  // 构建边关系（只考虑主数据流边）
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (!sourceNode || !targetNode) return

    const sourceCat = getNodeCategory(sourceNode)
    const targetCat = getNodeCategory(targetNode)

    // 只处理主数据流：数据源 → 计算任务 → 输出，以及 计算任务 → 计算任务
    const isMainFlow =
      (sourceCat === 'dataSource' && (targetCat === 'computeTask' || targetCat === 'localTask')) ||
      (sourceCat === 'output' && (targetCat === 'computeTask' || targetCat === 'localTask')) ||
      ((sourceCat === 'computeTask' || sourceCat === 'localTask') && targetCat === 'output') ||
      ((sourceCat === 'computeTask' || sourceCat === 'localTask') && (targetCat === 'computeTask' || targetCat === 'localTask'))

    if (isMainFlow) {
      outgoing.get(edge.source)?.push(edge.target)
      incoming.get(edge.target)?.push(edge.source)
    }
  })

  return { outgoing, incoming }
}

/**
 * 拓扑排序，计算每个节点的层级
 */
function calculateLevels(
  nodes: Node[],
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>
): Map<string, number> {
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  const queue: string[] = []

  // 找到所有入度为 0 的节点（起始节点）
  nodes.forEach(node => {
    const cat = getNodeCategory(node)
    // 数据源节点作为起始点
    if (cat === 'dataSource') {
      levels.set(node.id, 0)
      queue.push(node.id)
      visited.add(node.id)
    }
  })

  // 如果没有数据源，找入度为 0 的节点
  if (queue.length === 0) {
    nodes.forEach(node => {
      const incomers = incoming.get(node.id) || []
      if (incomers.length === 0) {
        levels.set(node.id, 0)
        queue.push(node.id)
        visited.add(node.id)
      }
    })
  }

  // BFS 计算层级
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const currentLevel = levels.get(nodeId) || 0
    const targets = outgoing.get(nodeId) || []

    targets.forEach(targetId => {
      const existingLevel = levels.get(targetId)
      const newLevel = currentLevel + 1

      // 取最大层级（如果一个节点有多个输入）
      if (existingLevel === undefined || newLevel > existingLevel) {
        levels.set(targetId, newLevel)
      }

      if (!visited.has(targetId)) {
        visited.add(targetId)
        queue.push(targetId)
      }
    })
  }

  // 处理未被访问的节点（孤立节点）
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0)
    }
  })

  return levels
}

/**
 * 自定义 DAG 布局
 * 原则：
 * 1. 主数据流自上而下
 * 2. 模型节点在所属计算任务左侧
 * 3. 算力节点在所属计算任务右侧
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    nodeWidth = 280,
    nodeHeight = 120,
    verticalSpacing = 150,
    horizontalSpacing = 350,
    sideNodeOffset = 280
  } = options

  if (nodes.length === 0) return nodes

  // 分类节点
  const dataSources: Node[] = []
  const computeTasks: Node[] = []
  const outputs: Node[] = []
  const models: Node[] = []
  const computeResources: Node[] = []
  const localTasks: Node[] = []

  nodes.forEach(node => {
    const cat = getNodeCategory(node)
    switch (cat) {
      case 'dataSource': dataSources.push(node); break
      case 'computeTask': computeTasks.push(node); break
      case 'output': outputs.push(node); break
      case 'model': models.push(node); break
      case 'computeResource': computeResources.push(node); break
      case 'localTask': localTasks.push(node); break
    }
  })

  // 构建邻接表和计算层级
  const { outgoing, incoming } = buildAdjacencyList(nodes, edges)
  const levels = calculateLevels(nodes, outgoing, incoming)

  // 按层级分组主数据流节点
  const levelGroups = new Map<number, Node[]>()
  const mainFlowNodes = [...dataSources, ...computeTasks, ...localTasks, ...outputs]

  mainFlowNodes.forEach(node => {
    const level = levels.get(node.id) || 0
    if (!levelGroups.has(level)) {
      levelGroups.set(level, [])
    }
    levelGroups.get(level)!.push(node)
  })

  // 计算主数据流节点的位置
  const nodePositions = new Map<string, { x: number; y: number }>()

  // 计算每一层的水平位置
  levelGroups.forEach((levelNodes, level) => {
    const totalWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * horizontalSpacing
    const startX = -totalWidth / 2

    levelNodes.forEach((node, index) => {
      nodePositions.set(node.id, {
        x: startX + index * (nodeWidth + horizontalSpacing),
        y: level * (nodeHeight + verticalSpacing)
      })
    })
  })

  // 处理模型节点和算力节点
  // 找到每个模型/算力节点关联的计算任务
  const taskRightSideUsed = new Map<string, number>() // 记录每个任务右侧已使用的位置数
  const taskLeftSideUsed = new Map<string, number>()  // 记录每个任务左侧已使用的位置数

  // 从边中找到模型/算力节点关联的任务
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (!sourceNode || !targetNode) return

    const sourceCat = getNodeCategory(sourceNode)
    const targetCat = getNodeCategory(targetNode)

    // 模型节点 → 计算任务
    if (sourceCat === 'model' && (targetCat === 'computeTask' || targetCat === 'localTask')) {
      const taskPos = nodePositions.get(targetNode.id)
      if (taskPos) {
        const leftCount = taskLeftSideUsed.get(targetNode.id) || 0
        nodePositions.set(sourceNode.id, {
          x: taskPos.x - sideNodeOffset,
          y: taskPos.y + leftCount * (nodeHeight + 30)
        })
        taskLeftSideUsed.set(targetNode.id, leftCount + 1)
      }
    }

    // 算力节点 → 计算任务
    if (sourceCat === 'computeResource' && (targetCat === 'computeTask' || targetCat === 'localTask')) {
      const taskPos = nodePositions.get(targetNode.id)
      if (taskPos) {
        const rightCount = taskRightSideUsed.get(targetNode.id) || 0
        nodePositions.set(sourceNode.id, {
          x: taskPos.x + sideNodeOffset + nodeWidth,
          y: taskPos.y + rightCount * (nodeHeight + 30)
        })
        taskRightSideUsed.set(targetNode.id, rightCount + 1)
      }
    }
  })

  // 处理未连接的模型和算力节点
  let unconnectedX = 500
  models.forEach(node => {
    if (!nodePositions.has(node.id)) {
      nodePositions.set(node.id, {
        x: unconnectedX,
        y: 0
      })
      unconnectedX += nodeWidth + horizontalSpacing
    }
  })

  computeResources.forEach(node => {
    if (!nodePositions.has(node.id)) {
      nodePositions.set(node.id, {
        x: unconnectedX,
        y: 0
      })
      unconnectedX += nodeWidth + horizontalSpacing
    }
  })

  // 返回重新定位的节点
  return nodes.map(node => {
    const position = nodePositions.get(node.id)
    if (position) {
      return {
        ...node,
        position
      }
    }
    return node
  })
}
