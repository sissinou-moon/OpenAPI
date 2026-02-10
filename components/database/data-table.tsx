'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { QueryResult } from '@/lib/database-types';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    Eye,
    EyeOff,
    Database,
    Rows3,
} from 'lucide-react';

interface DataTableProps {
    data: QueryResult | null;
    loading: boolean;
    sensitiveColumns?: string[];
    tableName?: string;
    onPageChange?: (page: number) => void;
    className?: string;
}

export function DataTable({
    data,
    loading,
    sensitiveColumns = [],
    tableName,
    onPageChange,
    className,
}: DataTableProps) {
    const [revealedCols, setRevealedCols] = useState<Set<string>>(new Set());

    const toggleReveal = (col: string) => {
        setRevealedCols((prev) => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    };

    const isSensitive = (col: string) => sensitiveColumns.includes(col);

    // Loading skeleton
    if (loading) {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
                <Loader2 size={24} className="text-emerald-400 animate-spin" />
                <p className="text-sm text-neutral-500">Loading data...</p>
            </div>
        );
    }

    // No data
    if (!data || data.rows.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
                <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                    <Rows3 size={20} className="text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500">
                    {data ? 'No rows found' : 'Connect to a database and select a table'}
                </p>
            </div>
        );
    }

    const totalPages = Math.ceil(data.totalCount / data.pageSize);

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Table Header Info */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                <div className="flex items-center gap-2">
                    <Database size={13} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-neutral-300">
                        {tableName || 'Query Results'}
                    </span>
                    <span className="text-[10px] text-neutral-600 px-1.5 py-0.5 rounded bg-neutral-800">
                        {data.totalCount} rows
                    </span>
                </div>
            </div>

            {/* Scrollable Table */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-neutral-700">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-neutral-800/80 backdrop-blur-sm">
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-700 w-10">
                                #
                            </th>
                            {data.columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-3 py-2 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-700 whitespace-nowrap"
                                >
                                    <span className="flex items-center gap-1.5">
                                        {col}
                                        {isSensitive(col) && (
                                            <button
                                                onClick={() => toggleReveal(col)}
                                                className="text-neutral-600 hover:text-neutral-400 transition-colors"
                                                title={revealedCols.has(col) ? 'Hide values' : 'Reveal values'}
                                            >
                                                {revealedCols.has(col) ? (
                                                    <EyeOff size={10} />
                                                ) : (
                                                    <Eye size={10} />
                                                )}
                                            </button>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                            >
                                <td className="px-3 py-2 text-[10px] text-neutral-600 font-mono">
                                    {(data.page - 1) * data.pageSize + rowIdx + 1}
                                </td>
                                {data.columns.map((col) => {
                                    const value = row[col];
                                    const masked = isSensitive(col) && !revealedCols.has(col);

                                    return (
                                        <td
                                            key={col}
                                            className="px-3 py-2 text-xs text-neutral-300 font-mono whitespace-nowrap max-w-[250px] truncate"
                                        >
                                            {masked ? (
                                                <span className="text-neutral-600 select-none">
                                                    ••••••••
                                                </span>
                                            ) : value === null ? (
                                                <span className="text-neutral-700 italic">NULL</span>
                                            ) : typeof value === 'boolean' ? (
                                                <span
                                                    className={
                                                        value ? 'text-emerald-400' : 'text-red-400'
                                                    }
                                                >
                                                    {String(value)}
                                                </span>
                                            ) : (
                                                String(value)
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-800 bg-neutral-900/50 shrink-0">
                    <span className="text-[11px] text-neutral-500">
                        Page {data.page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange?.(1)}
                            disabled={data.page <= 1}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsLeft size={14} />
                        </button>
                        <button
                            onClick={() => onPageChange?.(data.page - 1)}
                            disabled={data.page <= 1}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={() => onPageChange?.(data.page + 1)}
                            disabled={data.page >= totalPages}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <button
                            onClick={() => onPageChange?.(totalPages)}
                            disabled={data.page >= totalPages}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
