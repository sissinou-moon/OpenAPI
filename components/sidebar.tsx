'use client';

import { useState } from 'react';
import { cn } from "@/lib/utils";
import { type OpenAPISpec, type PathItem, type Operation } from "@/lib/openapi";
import { MethodBadge } from "@/components/method-badge";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface SidebarProps {
    spec: OpenAPISpec | null;
    onSelectRoute: (path: string, method: string) => void;
    className?: string;
}

interface TagGroup {
    name: string;
    description?: string;
    routes: { path: string; method: string; operation: Operation }[];
}

export function Sidebar({ spec, onSelectRoute, className }: SidebarProps) {
    const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Authentication']));
    const [apiExpanded, setApiExpanded] = useState(true);

    if (!spec) return null;

    // Group routes by tags
    const tagGroups: TagGroup[] = [];
    const tagMap = new Map<string, TagGroup>();

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
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
                <h2 className="font-semibold text-emerald-400 truncate text-sm">{spec.info.title}</h2>
                <p className="text-xs text-neutral-500 truncate mt-0.5">v{spec.info.version}</p>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                <div className="py-2">
                    {/* API Root Node */}
                    <button
                        onClick={() => setApiExpanded(!apiExpanded)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-neutral-800/50 text-left"
                    >
                        {apiExpanded ? (
                            <ChevronDown size={14} className="text-neutral-500" />
                        ) : (
                            <ChevronRight size={14} className="text-neutral-500" />
                        )}
                        {apiExpanded ? (
                            <FolderOpen size={14} className="text-emerald-500" />
                        ) : (
                            <Folder size={14} className="text-emerald-500" />
                        )}
                        <span className="text-sm font-medium truncate">{spec.info.title}</span>
                    </button>

                    {/* Tags */}
                    {apiExpanded && tagGroups.map(group => (
                        <div key={group.name} className="ml-4">
                            {/* Tag Header */}
                            <button
                                onClick={() => toggleTag(group.name)}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-neutral-800/50 text-left"
                            >
                                {expandedTags.has(group.name) ? (
                                    <ChevronDown size={12} className="text-neutral-500" />
                                ) : (
                                    <ChevronRight size={12} className="text-neutral-500" />
                                )}
                                {expandedTags.has(group.name) ? (
                                    <FolderOpen size={12} className="text-amber-500" />
                                ) : (
                                    <Folder size={12} className="text-amber-500" />
                                )}
                                <span className="text-xs font-medium text-neutral-400">{group.name}</span>
                                <span className="text-[10px] text-neutral-600 ml-auto">{group.routes.length}</span>
                            </button>

                            {/* Routes */}
                            {expandedTags.has(group.name) && (
                                <div className="ml-4">
                                    {group.routes.map(({ path, method, operation }) => (
                                        <button
                                            key={`${method}-${path}`}
                                            onClick={() => onSelectRoute(path, method)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800 rounded text-left group"
                                        >
                                            <MethodBadge method={method} className="text-[9px] px-1 py-0.5 shrink-0" />
                                            <span className="text-xs text-neutral-400 group-hover:text-white truncate">
                                                {operation.summary || path}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
