'use client';

import { useState } from 'react';
import { cn } from "@/lib/utils";
import { type OpenAPISpec, type PathItem, type Operation } from "@/lib/openapi";
import { type DatabaseSchema } from "@/lib/database-types";
import { MethodBadge } from "@/components/method-badge";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Database, Table2 } from 'lucide-react';

interface SidebarProps {
    spec: OpenAPISpec | null;
    dbSchema?: DatabaseSchema | null;
    onSelectRoute: (path: string, method: string) => void;
    onSelectTable?: (tableName: string) => void;
    className?: string;
}

interface TagGroup {
    name: string;
    description?: string;
    routes: { path: string; method: string; operation: Operation }[];
}

export function Sidebar({ spec, dbSchema, onSelectRoute, onSelectTable, className }: SidebarProps) {
    const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Authentication']));
    const [apiExpanded, setApiExpanded] = useState(true);
    const [dbExpanded, setDbExpanded] = useState(true);

    // Group routes by tags
    const tagGroups: TagGroup[] = [];
    const tagMap = new Map<string, TagGroup>();

    if (spec) {
        // Initialize from spec.tags if available
        if (spec.tags) {
            for (const tag of spec.tags) {
                const group: TagGroup = { name: tag.name, description: tag.description, routes: [] };
                tagMap.set(tag.name, group);
                tagGroups.push(group);
            }
        }

        // Collect routes into tag groups
        Object.entries(spec.paths).forEach(([path, pathItem]) => {
            const methods: (keyof PathItem)[] = ['get', 'post', 'put', 'delete', 'patch'];
            methods.forEach(method => {
                const op = pathItem[method] as Operation | undefined;
                if (op) {
                    const tags = op.tags || ['default'];
                    tags.forEach(tagName => {
                        let group = tagMap.get(tagName);
                        if (!group) {
                            group = { name: tagName, routes: [] };
                            tagMap.set(tagName, group);
                            tagGroups.push(group);
                        }
                        group.routes.push({ path, method: method as string, operation: op });
                    });
                }
            });
        });
    }

    const toggleTag = (tagName: string) => {
        setExpandedTags(prev => {
            const next = new Set(prev);
            if (next.has(tagName)) {
                next.delete(tagName);
            } else {
                next.add(tagName);
            }
            return next;
        });
    };

    return (
        <div className={cn("h-full flex flex-col bg-neutral-900 text-neutral-300", className)}>
            {/* API Title Header */}
            {spec && (
                <div className="p-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
                    <h2 className="font-semibold text-emerald-400 truncate text-sm">{spec.info.title}</h2>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">v{spec.info.version}</p>
                </div>
            )}

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                <div className="py-2">
                    {/* API Section */}
                    {spec && (
                        <div className="mb-4">
                            <button
                                onClick={() => setApiExpanded(!apiExpanded)}
                                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-neutral-800/50 text-left"
                            >
                                {apiExpanded ? (
                                    <ChevronDown size={14} className="text-neutral-500" />
                                ) : (
                                    <ChevronRight size={14} className="text-neutral-500" />
                                )}
                                <div className="p-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <FolderOpen size={12} className="text-emerald-500" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">API Routes</span>
                            </button>

                            {apiExpanded && tagGroups.map(group => (
                                <div key={group.name} className="ml-4">
                                    <button
                                        onClick={() => toggleTag(group.name)}
                                        className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-neutral-800/50 text-left mt-1"
                                    >
                                        {expandedTags.has(group.name) ? (
                                            <ChevronDown size={12} className="text-neutral-600" />
                                        ) : (
                                            <ChevronRight size={12} className="text-neutral-600" />
                                        )}
                                        <Folder size={12} className="text-amber-500/80" />
                                        <span className="text-xs font-medium text-neutral-400">{group.name}</span>
                                        <span className="text-[9px] text-neutral-600 ml-auto bg-neutral-800 px-1.5 rounded-full">{group.routes.length}</span>
                                    </button>

                                    {expandedTags.has(group.name) && (
                                        <div className="ml-5 border-l border-neutral-800 my-1">
                                            {group.routes.map(({ path, method, operation }) => (
                                                <button
                                                    key={`${method}-${path}`}
                                                    onClick={() => onSelectRoute(path, method)}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800 text-left group border-l-2 border-transparent hover:border-emerald-500"
                                                >
                                                    <MethodBadge method={method} className="text-[9px] px-1 py-0.5 shrink-0 scale-90" />
                                                    <span className="text-xs text-neutral-400 group-hover:text-emerald-100 truncate transition-colors">
                                                        {operation.summary || path}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Database Section */}
                    {dbSchema && (
                        <div className="mt-2">
                            <button
                                onClick={() => setDbExpanded(!dbExpanded)}
                                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-neutral-800/50 text-left"
                            >
                                {dbExpanded ? (
                                    <ChevronDown size={14} className="text-neutral-500" />
                                ) : (
                                    <ChevronRight size={14} className="text-neutral-500" />
                                )}
                                <div className="p-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                                    <Database size={12} className="text-blue-500" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Database</span>
                            </button>

                            {dbExpanded && (
                                <div className="ml-5 border-l border-neutral-800 my-1">
                                    {Object.entries(dbSchema.tables).map(([tableName, table]) => (
                                        <button
                                            key={tableName}
                                            onClick={() => onSelectTable?.(tableName)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-800 text-left group border-l-2 border-transparent hover:border-blue-500"
                                        >
                                            <Table2 size={12} className="text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                                            <span className="text-xs text-neutral-400 group-hover:text-blue-100 truncate transition-colors">
                                                {tableName}
                                            </span>
                                            <span className="ml-auto text-[9px] text-neutral-600 group-hover:text-neutral-500">
                                                {Object.keys(table.columns).length} cols
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Database Connection Status Footer if needed could go here */}
        </div>
    );
}
