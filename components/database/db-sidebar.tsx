'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DatabaseSchema, TableDef } from '@/lib/database-types';
import {
    ChevronRight,
    ChevronDown,
    Table2,
    Database,
    Search,
    Columns3,
    Link2,
} from 'lucide-react';

interface DbSidebarProps {
    schema: DatabaseSchema | null;
    selectedTable: string | null;
    onSelectTable: (name: string) => void;
    className?: string;
}

export function DbSidebar({
    schema,
    selectedTable,
    onSelectTable,
    className,
}: DbSidebarProps) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(true);

    const filteredTables = useMemo(() => {
        if (!schema) return [];
        const entries = Object.entries(schema.tables);
        if (!search) return entries;
        return entries.filter(([name]) =>
            name.toLowerCase().includes(search.toLowerCase())
        );
    }, [schema, search]);

    if (!schema) return null;

    const db = schema.database;

    return (
        <div
            className={cn(
                'h-full flex flex-col bg-neutral-900 text-neutral-300',
                className
            )}
        >
            {/* DB Header */}
            <div className="p-3 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-emerald-400" />
                    <h2 className="font-semibold text-emerald-400 truncate text-sm">
                        {db.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 uppercase tracking-wider">
                        {db.engine}
                    </span>
                    {db.schema && (
                        <span className="text-[10px] text-neutral-500">
                            schema: {db.schema}
                        </span>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-neutral-800">
                <div className="relative">
                    <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                        type="text"
                        placeholder="Search tables..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-neutral-800/60 rounded-md pl-7 pr-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all"
                    />
                </div>
            </div>

            {/* Table Tree */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                <div className="py-2">
                    {/* Tables Root Node */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-neutral-800/50 text-left"
                    >
                        {expanded ? (
                            <ChevronDown size={14} className="text-neutral-500" />
                        ) : (
                            <ChevronRight size={14} className="text-neutral-500" />
                        )}
                        <Database size={14} className="text-emerald-500" />
                        <span className="text-sm font-medium truncate">Tables</span>
                        <span className="text-[10px] text-neutral-600 ml-auto">
                            {Object.keys(schema.tables).length}
                        </span>
                    </button>

                    {/* Table List */}
                    {expanded &&
                        filteredTables.map(([name, table]) => {
                            const colCount = Object.keys(table.columns).length;
                            const relCount = table.relations
                                ? Object.keys(table.relations).length
                                : 0;
                            const isSelected = selectedTable === name;

                            return (
                                <button
                                    key={name}
                                    onClick={() => onSelectTable(name)}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-3 py-1.5 ml-4 text-left group rounded-l transition-all',
                                        isSelected
                                            ? 'bg-emerald-500/10 border-r-2 border-emerald-500'
                                            : 'hover:bg-neutral-800/50'
                                    )}
                                >
                                    <Table2
                                        size={13}
                                        className={cn(
                                            'shrink-0',
                                            isSelected ? 'text-emerald-400' : 'text-amber-500'
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'text-xs font-medium truncate',
                                            isSelected
                                                ? 'text-emerald-300'
                                                : 'text-neutral-400 group-hover:text-white'
                                        )}
                                    >
                                        {name}
                                    </span>

                                    {/* Badges */}
                                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                                        <span className="flex items-center gap-0.5 text-[10px] text-neutral-600">
                                            <Columns3 size={9} />
                                            {colCount}
                                        </span>
                                        {relCount > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-neutral-600">
                                                <Link2 size={9} />
                                                {relCount}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
