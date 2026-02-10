'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DatabaseSchema } from '@/lib/database-types';

interface RelationsViewProps {
    schema: DatabaseSchema;
    selectedTable: string | null;
    onSelectTable: (name: string) => void;
    className?: string;
}

interface TableNode {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    colCount: number;
}

interface RelationLine {
    from: string;
    to: string;
    label: string;
    type: string;
}

export function RelationsView({
    schema,
    selectedTable,
    onSelectTable,
    className,
}: RelationsViewProps) {
    const { nodes, lines } = useMemo(() => {
        const tableNames = Object.keys(schema.tables);
        const count = tableNames.length;

        // Grid layout
        const cols = Math.ceil(Math.sqrt(count));
        const nodeW = 180;
        const nodeH = 60;
        const gapX = 100;
        const gapY = 80;

        const tableNodes: TableNode[] = tableNames.map((name, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return {
                name,
                x: 60 + col * (nodeW + gapX),
                y: 60 + row * (nodeH + gapY),
                width: nodeW,
                height: nodeH,
                colCount: Object.keys(schema.tables[name].columns).length,
            };
        });

        const relationLines: RelationLine[] = [];
        const seenPairs = new Set<string>();

        for (const [tableName, table] of Object.entries(schema.tables)) {
            if (!table.relations) continue;
            for (const [relName, rel] of Object.entries(table.relations)) {
                const pairKey = [tableName, rel.table].sort().join(':');
                if (seenPairs.has(pairKey)) continue;
                seenPairs.add(pairKey);
                relationLines.push({
                    from: tableName,
                    to: rel.table,
                    label: rel.type,
                    type: rel.type,
                });
            }
        }

        return { nodes: tableNodes, lines: relationLines };
    }, [schema]);

    const nodeMap = new Map(nodes.map((n) => [n.name, n]));

    // Calculate SVG dimensions
    const maxX = Math.max(...nodes.map((n) => n.x + n.width)) + 80;
    const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + 80;

    function getLineColor(type: string): string {
        switch (type) {
            case 'one-to-one': return '#34d399';
            case 'one-to-many': return '#38bdf8';
            case 'many-to-one': return '#fbbf24';
            case 'many-to-many': return '#a78bfa';
            default: return '#6b7280';
        }
    }

    return (
        <div className={cn('h-full overflow-auto bg-neutral-950/50', className)}>
            <svg
                width={maxX}
                height={maxY}
                className="min-w-full min-h-full"
            >
                <defs>
                    {/* Glow filter */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Arrow markers per type */}
                    {['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'].map(
                        (type) => (
                            <marker
                                key={type}
                                id={`arrow-${type}`}
                                viewBox="0 0 10 7"
                                refX="10"
                                refY="3.5"
                                markerWidth="8"
                                markerHeight="6"
                                orient="auto-start-reverse"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill={getLineColor(type)}
                                    opacity={0.7}
                                />
                            </marker>
                        )
                    )}
                </defs>

                {/* Grid pattern */}
                <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Relation Lines */}
                {lines.map((line, i) => {
                    const fromNode = nodeMap.get(line.from);
                    const toNode = nodeMap.get(line.to);
                    if (!fromNode || !toNode) return null;

                    const x1 = fromNode.x + fromNode.width / 2;
                    const y1 = fromNode.y + fromNode.height / 2;
                    const x2 = toNode.x + toNode.width / 2;
                    const y2 = toNode.y + toNode.height / 2;

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const color = getLineColor(line.type);

                    return (
                        <g key={i}>
                            <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={color}
                                strokeWidth={1.5}
                                strokeOpacity={0.4}
                                markerEnd={`url(#arrow-${line.type})`}
                            />
                            {/* Label */}
                            <rect
                                x={midX - 35}
                                y={midY - 8}
                                width={70}
                                height={16}
                                rx={4}
                                fill="#171717"
                                stroke={color}
                                strokeWidth={0.5}
                                strokeOpacity={0.3}
                            />
                            <text
                                x={midX}
                                y={midY + 4}
                                textAnchor="middle"
                                className="text-[8px] font-mono"
                                fill={color}
                                opacity={0.8}
                            >
                                {line.label}
                            </text>
                        </g>
                    );
                })}

                {/* Table Nodes */}
                {nodes.map((node) => {
                    const isSelected = selectedTable === node.name;
                    return (
                        <g
                            key={node.name}
                            onClick={() => onSelectTable(node.name)}
                            className="cursor-pointer"
                        >
                            {/* Shadow / glow for selected */}
                            {isSelected && (
                                <rect
                                    x={node.x - 3}
                                    y={node.y - 3}
                                    width={node.width + 6}
                                    height={node.height + 6}
                                    rx={14}
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth={1}
                                    opacity={0.3}
                                    filter="url(#glow)"
                                />
                            )}
                            {/* Card */}
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                rx={12}
                                fill={isSelected ? '#0d1f17' : '#171717'}
                                stroke={isSelected ? '#34d399' : '#2a2a2a'}
                                strokeWidth={isSelected ? 1.5 : 1}
                            />
                            {/* Table Name */}
                            <text
                                x={node.x + 14}
                                y={node.y + 24}
                                className="text-[12px] font-semibold"
                                fill={isSelected ? '#6ee7b7' : '#e5e5e5'}
                            >
                                {node.name}
                            </text>
                            {/* Column count */}
                            <text
                                x={node.x + 14}
                                y={node.y + 42}
                                className="text-[10px] font-mono"
                                fill="#737373"
                            >
                                {node.colCount} columns
                            </text>
                            {/* Accent bar */}
                            <rect
                                x={node.x}
                                y={node.y}
                                width={4}
                                height={node.height}
                                rx={2}
                                fill={isSelected ? '#34d399' : '#404040'}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
