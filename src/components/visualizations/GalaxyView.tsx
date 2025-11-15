import React, { useEffect, useRef, useState } from 'react';

interface MedicalRecord {
  id: string;
  type: string;
  date: string;
  title: string;
  category: string;
  connections?: string[];
  metadata?: Record<string, unknown>;
}

interface GalaxyNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  record: MedicalRecord;
  color: string;
  mass: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

interface GalaxyViewProps {
  records: MedicalRecord[];
  onRecordClick?: (record: MedicalRecord) => void;
  width?: number;
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  diagnosis: '#ef4444',
  condition: '#ef4444',
  medication: '#10b981',
  labResult: '#06b6d4',
  procedure: '#f59e0b',
  imaging: '#8b5cf6',
  observation: '#06b6d4',
  default: '#6b7280',
};

const TYPE_ICONS: Record<string, string> = {
  condition: '🏥',
  diagnosis: '🏥',
  procedure: '⚕️',
  medication: '💊',
  observation: '📊',
  labResult: '🔬',
  imaging: '📷',
  encounter: '📅',
  default: '●',
};

export function GalaxyView({ records, onRecordClick, width = 1100, height = 700 }: GalaxyViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [nodes, setNodes] = useState<GalaxyNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GalaxyNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<GalaxyNode | null>(null);
  const [isStabilized, setIsStabilized] = useState(false);
  const frameCount = useRef(0);

  useEffect(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const initialNodes: GalaxyNode[] = [];
    const initialEdges: Edge[] = [];

    records.forEach((record, index) => {
      const angle = (index / records.length) * 2 * Math.PI;
      const distance = Math.min(width, height) * 0.25 + Math.random() * 50;
      const radiusBase = record.type === 'condition' ? 30 : 25;

      initialNodes.push({
        id: record.id,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: radiusBase,
        record,
        color: CATEGORY_COLORS[record.category] || CATEGORY_COLORS.default,
        mass: radiusBase / 10,
      });
    });

    records.forEach((record) => {
      if (record.connections && record.connections.length > 0) {
        record.connections.forEach((targetId) => {
          if (records.find((r) => r.id === targetId)) {
            const existingEdge = initialEdges.find(
              (e) =>
                (e.source === record.id && e.target === targetId) ||
                (e.source === targetId && e.target === record.id)
            );
            if (!existingEdge) {
              initialEdges.push({
                source: record.id,
                target: targetId,
                strength: 1.0,
              });
            }
          }
        });
      }
    });

    const typeGroups: Record<string, string[]> = {};
    records.forEach((record) => {
      if (!typeGroups[record.type]) {
        typeGroups[record.type] = [];
      }
      typeGroups[record.type].push(record.id);
    });

    Object.values(typeGroups).forEach((group) => {
      if (group.length > 1) {
        for (let i = 0; i < group.length - 1; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const existingEdge = initialEdges.find(
              (e) =>
                (e.source === group[i] && e.target === group[j]) ||
                (e.source === group[j] && e.target === group[i])
            );
            if (!existingEdge) {
              initialEdges.push({
                source: group[i],
                target: group[j],
                strength: 0.3,
              });
            }
          }
        }
      }
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsStabilized(false);
    frameCount.current = 0;
  }, [records, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;

    let lastTime = performance.now();
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        lastTime = currentTime - (deltaTime % frameTime);
        frameCount.current++;

        ctx.clearRect(0, 0, width, height);

        const damping = frameCount.current < 300 ? 0.92 : 0.85;
        const centerPull = frameCount.current < 300 ? 0.002 : 0.0005;
        const repulsionStrength = frameCount.current < 300 ? 100 : 80;
        const repulsionDistance = 120;
        const edgeSpringStrength = frameCount.current < 300 ? 0.05 : 0.02;

        nodes.forEach((node) => {
          if (isDragging && dragNode?.id === node.id) {
            node.vx = 0;
            node.vy = 0;
            return;
          }

          const dx = centerX - node.x;
          const dy = centerY - node.y;
          const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

          if (distanceFromCenter > 50) {
            node.vx += (dx / distanceFromCenter) * centerPull * node.mass;
            node.vy += (dy / distanceFromCenter) * centerPull * node.mass;
          }

          nodes.forEach((otherNode) => {
            if (node.id === otherNode.id) return;

            const dx = otherNode.x - node.x;
            const dy = otherNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < repulsionDistance && distance > 0) {
              const force = (repulsionStrength * node.mass * otherNode.mass) / (distance * distance);
              node.vx -= (dx / distance) * force;
              node.vy -= (dy / distance) * force;
            }
          });

          edges.forEach((edge) => {
            let targetNode: GalaxyNode | undefined;
            let isSource = false;

            if (edge.source === node.id) {
              targetNode = nodes.find((n) => n.id === edge.target);
              isSource = true;
            } else if (edge.target === node.id) {
              targetNode = nodes.find((n) => n.id === edge.source);
              isSource = false;
            }

            if (targetNode) {
              const dx = targetNode.x - node.x;
              const dy = targetNode.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const idealDistance = 150;

              if (distance > 0) {
                const force = ((distance - idealDistance) / distance) * edgeSpringStrength * edge.strength;
                node.vx += (dx / distance) * force;
                node.vy += (dy / distance) * force;
              }
            }
          });

          node.vx *= damping;
          node.vy *= damping;

          const maxVelocity = 5;
          const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          if (velocity > maxVelocity) {
            node.vx = (node.vx / velocity) * maxVelocity;
            node.vy = (node.vy / velocity) * maxVelocity;
          }

          node.x += node.vx;
          node.y += node.vy;

          const margin = node.radius + 10;
          if (node.x < margin) {
            node.x = margin;
            node.vx *= -0.5;
          }
          if (node.x > width - margin) {
            node.x = width - margin;
            node.vx *= -0.5;
          }
          if (node.y < margin) {
            node.y = margin;
            node.vy *= -0.5;
          }
          if (node.y > height - margin) {
            node.y = height - margin;
            node.vy *= -0.5;
          }
        });

        edges.forEach((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

          if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);

            const opacity = edge.strength === 1.0 ? 0.4 : 0.15;
            const width = edge.strength === 1.0 ? 2 : 1;
            ctx.strokeStyle = `rgba(100, 116, 139, ${opacity})`;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        });

        nodes.forEach((node) => {
          const isSelected = selectedNode?.id === node.id;

          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
          gradient.addColorStop(0, node.color);
          gradient.addColorStop(1, node.color + '99');

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = `${node.radius * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icon = TYPE_ICONS[node.record.type] || TYPE_ICONS.default;
          ctx.fillText(icon, node.x, node.y);
        });

        if (frameCount.current >= 300 && !isStabilized) {
          const totalVelocity = nodes.reduce((sum, node) => {
            return sum + Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          }, 0);
          const avgVelocity = totalVelocity / nodes.length;

          if (avgVelocity < 0.1) {
            setIsStabilized(true);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, width, height, selectedNode, isDragging, dragNode, isStabilized]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setDragNode(clickedNode);
      setIsDragging(true);
      onRecordClick?.(clickedNode.record);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === dragNode.id ? { ...node, x, y, vx: 0, vy: 0 } : node
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNode(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-slate-700 rounded-lg cursor-pointer bg-slate-900"
      />

      {!isStabilized && frameCount.current < 300 && (
        <div className="absolute top-4 left-4 bg-slate-800/90 px-3 py-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-300">Stabilizing layout...</span>
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="absolute top-4 right-4 bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{TYPE_ICONS[selectedNode.record.type] || '●'}</span>
            <div>
              <h3 className="font-semibold text-white">{selectedNode.record.title}</h3>
              <p className="text-xs text-slate-400 capitalize">{selectedNode.record.type}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              Category: <span className="text-white">{selectedNode.record.category}</span>
            </p>
            <p className="text-slate-400">
              Date: <span className="text-white">{new Date(selectedNode.record.date).toLocaleDateString()}</span>
            </p>
            {selectedNode.record.connections && selectedNode.record.connections.length > 0 && (
              <p className="text-slate-400">
                Connections: <span className="text-white">{selectedNode.record.connections.length}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="text-sm text-slate-400 font-semibold">Legend:</div>
        {Object.entries(CATEGORY_COLORS)
          .filter(([key]) => key !== 'default')
          .map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-slate-400 capitalize">{category}</span>
            </div>
          ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span>Total Nodes: {nodes.length}</span>
        <span>•</span>
        <span>Edges: {edges.length}</span>
        <span>•</span>
        <span>Status: {isStabilized ? '✓ Stabilized' : 'Settling...'}</span>
      </div>
    </div>
  );
}
