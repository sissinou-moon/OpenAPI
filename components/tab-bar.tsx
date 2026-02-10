'use client';

import { cn } from '@/lib/utils';
import { MethodBadge } from '@/components/method-badge';
import { X, Table2 } from 'lucide-react';

export interface Tab {
    id: string;
    type: 'api' | 'database';
    label: string;
    // API specific
    path?: string;
    method?: string;
    // Database specific
    tableName?: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string | null;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
    className?: string;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, className }: TabBarProps) {
    if (tabs.length === 0) {
        return (
            <div className={cn("h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-4", className)}>
                <span className="text-xs text-neutral-500">No items open</span>
            </div>
        );
    }

    return (
        <div className={cn("h-10 bg-neutral-900 border-b border-neutral-800 flex items-center overflow-x-auto scrollbar-thin", className)}>
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        className={cn(
                            "flex items-center gap-2 px-3 h-full border-r border-neutral-800 cursor-pointer group transition-colors shrink-0 max-w-[200px]",
                            isActive
                                ? "bg-neutral-800 text-white border-b-2 border-b-emerald-500"
                                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                        )}
                        onClick={() => onSelectTab(tab.id)}
                    >
                        {tab.type === 'api' && tab.method && (
                            <MethodBadge method={tab.method} className="text-[9px] px-1 py-0.5" />
                        )}
                        {tab.type === 'database' && (
                            <Table2 size={12} className="text-blue-400" />
                        )}
                        <span className="text-xs truncate">{tab.label}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseTab(tab.id);
                            }}
                            className="ml-auto p-0.5 rounded hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
