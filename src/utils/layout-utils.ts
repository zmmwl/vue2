import dagre from 'dagre'
import type { Node, Edge } from '@vue-flow/core'

// 布局方向
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL'

// 布局配置
export interface LayoutOptions {
  direction?: LayoutDirection      // 布局方向，默认 TB（从上到下）
  nodeWidth?: number               // 节点宽度，默认 280
  nodeHeight?: number              // 节点高度，默认 120
  rankSpacing?: number             // 层级间距，默认 100
  nodeSpacing?: number             // 节点间距，默认 60
}

/**
 * 使用 dagre 算法自动布局节点
 * @param nodes 节点列表
 * @param edges 边列表
 * @param options 布局配置
 * @returns 重新定位后的节点列表
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    direction = 'TB',
    nodeWidth = 280,
    nodeHeight = 120,
    rankSpacing = 100,
    nodeSpacing = 60
  } = options

  if (nodes.length === 0) return nodes

  // 创建 dagre 图
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    ranksep: rankSpacing,
    nodesep: nodeSpacing,
    marginx: 80,
    marginy: 80
  })
  g.setDefaultEdgeLabel(() => ({}))

  // 添加节点
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight
    })
  })

  // 添加边
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  // 执行布局计算
  dagre.layout(g)

  // 返回新位置的节点
  return nodes.map(node => {
    const nodeWithPosition = g.node(node.id)
    if (nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2
        }
      }
    }
    return node
  })
}
