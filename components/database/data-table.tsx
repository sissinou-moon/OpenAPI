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
    Check,
    X,
    Code2,
    ToggleLeft,
    ToggleRight,
    Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableDef } from '@/lib/database-types';

interface DataTableProps {
    data: QueryResult | null;
    loading: boolean;
    sensitiveColumns?: string[];
    tableName?: string;
    tableDef?: TableDef | null;
    onPageChange?: (page: number) => void;
    onUpdateCell?: (row: any, column: string, value: any) => Promise<void>;
    className?: string;
}

export function DataTable({
    data,
    loading,
    sensitiveColumns = [],
    tableName,
    tableDef,
    onPageChange,
    onUpdateCell,
    className,
}: DataTableProps) {
    const [revealedCols, setRevealedCols] = useState<Set<string>>(new Set());
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [jsonEditorOpen, setJsonEditorOpen] = useState(false);

    const toggleReveal = (col: string) => {
        setRevealedCols((prev) => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    };

    const handleStartEdit = (rowIdx: number, col: string, value: any) => {
        const columnType = tableDef?.columns[col]?.type.toLowerCase();

        if (columnType === 'boolean' || typeof value === 'boolean') {
            // Instant toggle for booleans
            handleUpdate(data?.rows[rowIdx], col, !value);
            return;
        }

        if (columnType === 'json' || columnType === 'jsonb' || (value && typeof value === 'object')) {
            setEditingCell({ rowIdx, col });
            setEditValue(JSON.stringify(value, null, 2));
            setJsonEditorOpen(true);
            return;
        }

        setEditingCell({ rowIdx, col });
        setEditValue(String(value ?? ''));
    };

    const handleUpdate = async (row: any, col: string, newValue: any) => {
        if (!onUpdateCell) return;
        setIsUpdating(true);
        try {
            await onUpdateCell(row, col, newValue);
            setEditingCell(null);
            setJsonEditorOpen(false);
        } catch (err) {
            console.error('Update failed:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, col: string) => {
        if (e.key === 'Enter') {
            handleUpdate(data?.rows[rowIdx], col, editValue);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
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
                                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === col;

                                    return (
                                        <td
                                            key={col}
                                            onDoubleClick={() => !isEditing && handleStartEdit(rowIdx, col, value)}
                                            className={cn(
                                                "px-3 py-2 text-xs text-neutral-300 font-mono whitespace-nowrap max-w-[250px] truncate cursor-default group",
                                                isEditing && "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/50"
                                            )}
                                        >
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, rowIdx, col)}
                                                        className="bg-transparent border-none outline-none w-full text-emerald-400 placeholder:text-neutral-600"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdate(row, col, editValue)}
                                                        className="text-emerald-500 hover:text-emerald-400"
                                                    >
                                                        <Save size={12} />
                                                    </button>
                                                </div>
                                            ) : masked ? (
                                                <span className="text-neutral-600 select-none">
                                                    ••••••••
                                                </span>
                                            ) : value === null ? (
                                                <span className="text-neutral-700 italic">NULL</span>
                                            ) : typeof value === 'boolean' ? (
                                                <div className="flex items-center gap-2">
                                                    {value ? (
                                                        <ToggleRight className="text-emerald-400 cursor-pointer" size={16} onClick={() => handleUpdate(row, col, false)} />
                                                    ) : (
                                                        <ToggleLeft className="text-neutral-600 cursor-pointer hover:text-red-400 transition-colors" size={16} onClick={() => handleUpdate(row, col, true)} />
                                                    )}
                                                    <span className={value ? 'text-emerald-400' : 'text-red-400'}>
                                                        {String(value)}
                                                    </span>
                                                </div>
                                            ) : (typeof value === 'object') ? (
                                                <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-pointer">
                                                    <Code2 size={12} />
                                                    <span>{Array.isArray(value) ? `Array(${value.length})` : 'Object'}</span>
                                                </div>
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

            {/* JSON Editor Side Panel */}
            <AnimatePresence>
                {jsonEditorOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setJsonEditorOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[450px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-[101] flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                        <Code2 size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Edit JSON</h3>
                                        <p className="text-[10px] text-neutral-500 font-mono">{editingCell?.col}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setJsonEditorOpen(false)}
                                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 p-6 overflow-hidden">
                                <textarea
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none scrollbar-thin scrollbar-thumb-neutral-800"
                                    placeholder='{ "key": "value" }'
                                />
                            </div>

                            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setJsonEditorOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        try {
                                            const parsed = JSON.parse(editValue);
                                            if (editingCell) {
                                                handleUpdate(data?.rows[editingCell.rowIdx], editingCell.col, parsed);
                                            }
                                        } catch (err) {
                                            alert('Invalid JSON format');
                                        }
                                    }}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
                                >
                                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
