import React, { useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  type: 'patient' | 'condition' | 'procedure' | 'medication' | 'observation' | 'treatment_plan';
  label: string;
  data: any;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  context?: string;
}

interface DigitalTwinGraphViewProps {
  patientData: {
    patient: any;
    conditions: any[];
    procedures: any[];
    medications: any[];
    observations: any[];
    treatmentPlans: any[];
    relationships: any[];
  };
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const NODE_COLORS: Record<string, string> = {
  patient: '#3b82f6',
  condition: '#ef4444',
  procedure: '#f59e0b',
  medication: '#10b981',
  observation: '#06b6d4',
  treatment_plan: '#8b5cf6',
};

const NODE_ICONS: Record<string, string> = {
  patient: '👤',
  condition: '🏥',
  procedure: '⚕️',
  medication: '💊',
  observation: '📊',
  treatment_plan: '📋',
};

export function DigitalTwinGraphView({
  patientData,
  width = 1200,
  height = 800,
  onNodeClick,
}: DigitalTwinGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    const patientNode: GraphNode = {
      id: patientData.patient.id,
      type: 'patient',
      label: `${patientData.patient.given_name} ${patientData.patient.family_name}`,
      data: patientData.patient,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: 40,
      color: NODE_COLORS.patient,
    };
    newNodes.push(patientNode);

    const createNodesInCircle = (
      items: any[],
      type: string,
      startAngle: number,
      arcSize: number
    ) => {
      const distance = 250;
      items.forEach((item, index) => {
        const angle = startAngle + (index / items.length) * arcSize;
        const node: GraphNode = {
          id: item.id,
          type: type as any,
          label: item.display || item.medication_name || item.title || 'Unnamed',
          data: item,
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          vx: 0,
          vy: 0,
          radius: 25,
          color: NODE_COLORS[type] || '#6b7280',
        };
        newNodes.push(node);

        newEdges.push({
          id: `${patientNode.id}-${node.id}`,
          source: patientNode.id,
          target: node.id,
          relationshipType: `has_${type}`,
        });
      });
    };

    const totalItems =
      patientData.conditions.length +
      patientData.procedures.length +
      patientData.medications.length +
      patientData.observations.length +
      (patientData.treatmentPlans?.length || 0);

    let currentAngle = 0;
    const anglePerItem = (Math.PI * 2) / totalItems;

    if (patientData.conditions.length > 0) {
      const arc = anglePerItem * patientData.conditions.length;
      createNodesInCircle(patientData.conditions, 'condition', currentAngle, arc);
      currentAngle += arc;
    }

    if (patientData.procedures.length > 0) {
      const arc = anglePerItem * patientData.procedures.length;
      createNodesInCircle(patientData.procedures, 'procedure', currentAngle, arc);
      currentAngle += arc;
    }

    if (patientData.medications.length > 0) {
      const arc = anglePerItem * patientData.medications.length;
      createNodesInCircle(patientData.medications, 'medication', currentAngle, arc);
      currentAngle += arc;
    }

    if (patientData.observations.length > 0) {
      const arc = anglePerItem * patientData.observations.length;
      createNodesInCircle(patientData.observations, 'observation', currentAngle, arc);
      currentAngle += arc;
    }

    if (patientData.treatmentPlans && patientData.treatmentPlans.length > 0) {
      const arc = anglePerItem * patientData.treatmentPlans.length;
      createNodesInCircle(patientData.treatmentPlans, 'treatment_plan', currentAngle, arc);
    }

    patientData.relationships.forEach(rel => {
      const existingEdge = newEdges.find(
        e => e.source === rel.source_id && e.target === rel.target_id
      );
      if (!existingEdge) {
        newEdges.push({
          id: rel.id,
          source: rel.source_id,
          target: rel.target_id,
          relationshipType: rel.relationship_type,
          context: rel.context,
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [patientData, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      nodes.forEach(node => {
        if (node.type === 'patient') return;

        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const idealDistance = 250;
        const springForce = (distance - idealDistance) * 0.01;
        node.vx += (dx / distance) * springForce;
        node.vy += (dy / distance) * springForce;

        nodes.forEach(otherNode => {
          if (node.id === otherNode.id) return;

          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80 && distance > 0) {
            const repulsion = 50 / distance;
            node.vx -= (dx / distance) * repulsion;
            node.vy -= (dy / distance) * repulsion;
          }
        });

        node.vx *= 0.9;
        node.vy *= 0.9;

        if (!isDragging || dragNode?.id !== node.id) {
          node.x += node.vx;
          node.y += node.vy;
        }
      });

      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();

          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        }
      });

      nodes.forEach(node => {
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
        ctx.font = `${node.radius / 2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NODE_ICONS[node.type] || '●', node.x, node.y - 5);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ffffff';
        const labelParts = node.label.split(' ');
        if (labelParts.length > 2) {
          ctx.fillText(labelParts.slice(0, 2).join(' '), node.x, node.y + node.radius + 12);
        } else {
          ctx.fillText(node.label, node.x, node.y + node.radius + 12);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [nodes, edges, width, height, selectedNode, isDragging, dragNode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setDragNode(clickedNode);
      setIsDragging(true);
      onNodeClick?.(clickedNode);
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

    setNodes(prevNodes =>
      prevNodes.map(node =>
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

      {selectedNode && (
        <div className="absolute top-4 right-4 bg-slate-800 p-4 rounded-lg border border-slate-700 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{NODE_ICONS[selectedNode.type]}</span>
            <div>
              <h3 className="font-semibold text-white">{selectedNode.label}</h3>
              <p className="text-xs text-slate-400 capitalize">{selectedNode.type}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {selectedNode.type === 'condition' && (
              <>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="text-white ml-2">
                    {selectedNode.data.clinical_status}
                  </span>
                </div>
                {selectedNode.data.severity && (
                  <div>
                    <span className="text-slate-400">Severity:</span>
                    <span className="text-white ml-2">{selectedNode.data.severity}</span>
                  </div>
                )}
                {selectedNode.data.onset_date && (
                  <div>
                    <span className="text-slate-400">Onset:</span>
                    <span className="text-white ml-2">
                      {new Date(selectedNode.data.onset_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'procedure' && (
              <>
                <div>
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white ml-2">
                    {new Date(selectedNode.data.performed_date).toLocaleDateString()}
                  </span>
                </div>
                {selectedNode.data.primary_performer && (
                  <div>
                    <span className="text-slate-400">Performer:</span>
                    <span className="text-white ml-2">
                      {selectedNode.data.primary_performer}
                    </span>
                  </div>
                )}
                {selectedNode.data.outcome && (
                  <div>
                    <span className="text-slate-400">Outcome:</span>
                    <span className="text-white ml-2">{selectedNode.data.outcome}</span>
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'medication' && (
              <>
                <div>
                  <span className="text-slate-400">Dose:</span>
                  <span className="text-white ml-2">
                    {selectedNode.data.dose_quantity} {selectedNode.data.dose_unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Frequency:</span>
                  <span className="text-white ml-2">{selectedNode.data.frequency}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="text-white ml-2">{selectedNode.data.status}</span>
                </div>
              </>
            )}

            {selectedNode.type === 'observation' && (
              <>
                <div>
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white ml-2">
                    {new Date(selectedNode.data.effective_date).toLocaleDateString()}
                  </span>
                </div>
                {selectedNode.data.value_quantity && (
                  <div>
                    <span className="text-slate-400">Value:</span>
                    <span className="text-white ml-2">
                      {selectedNode.data.value_quantity} {selectedNode.data.value_unit}
                    </span>
                  </div>
                )}
                {selectedNode.data.interpretation && (
                  <div>
                    <span className="text-slate-400">Interpretation:</span>
                    <span className="text-white ml-2">
                      {selectedNode.data.interpretation}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xl">{NODE_ICONS[type]}</span>
            </div>
            <span className="text-sm text-slate-400 capitalize">
              {type.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
