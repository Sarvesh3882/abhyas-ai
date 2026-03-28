'use client'
import ReactFlow, { Node, Edge, Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

interface Branch {
  id: string; label: string; connection: string; is_weak_point: boolean
  children?: { id: string; label: string; memory_hook: string }[]
}
interface MindMapData {
  central_node: string
  branches: Branch[]
}

const nodeStyle = {
  background: '#13132B', border: '2px solid #6C63FF', borderRadius: '0px',
  color: '#EAEAEA', fontFamily: 'Inter', fontSize: '11px', padding: '8px 12px',
  boxShadow: '3px 3px 0px #000',
}
const weakStyle = { ...nodeStyle, border: '2px solid #FF6584', boxShadow: '0 0 12px #FF6584, 3px 3px 0px #000' }
const centralStyle = { ...nodeStyle, border: '2px solid #00F5FF', boxShadow: '0 0 12px #00F5FF, 3px 3px 0px #000' }

export default function MindMap({ data }: { data: MindMapData }) {
  const nodes: Node[] = []
  const edges: Edge[] = []

  nodes.push({ id: 'center', data: { label: data.central_node }, position: { x: 300, y: 200 }, style: centralStyle })

  data.branches?.forEach((branch, bi) => {
    const bx = bi === 0 ? 100 : bi === 1 ? 300 : 500
    const by = 50
    nodes.push({ id: branch.id, data: { label: branch.label }, position: { x: bx, y: by }, style: branch.is_weak_point ? weakStyle : nodeStyle })
    edges.push({ id: `e-center-${branch.id}`, source: 'center', target: branch.id, style: { stroke: '#6C63FF' }, label: branch.connection, labelStyle: { fill: '#7B7B9D', fontSize: 9 } })

    branch.children?.forEach((child, ci) => {
      const cx = bx + (ci === 0 ? -80 : 80)
      nodes.push({ id: child.id, data: { label: `${child.label}\n${child.memory_hook}` }, position: { x: cx, y: by - 80 }, style: { ...nodeStyle, fontSize: '9px' } })
      edges.push({ id: `e-${branch.id}-${child.id}`, source: branch.id, target: child.id, style: { stroke: '#6C63FF44' } })
    })
  })

  return (
    <div style={{ height: 300, background: '#13132B', border: '2px solid #6C63FF' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#1A1A35" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
