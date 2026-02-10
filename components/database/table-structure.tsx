'use client';

import { cn } from '@/lib/utils';
import { TableDef, RelationDef } from '@/lib/database-types';
import { motion } from 'framer-motion';
import {
    Key,
    Hash,
    Calendar,
    ToggleLeft,
    Type,
    Link2,
    ArrowRight,
    EyeOff,
    Fingerprint,
    Snowflake,
    AlertCircle,
    Database,
    List,
    ShieldCheck,
    Cuboid,
} from 'lucide-react';

interface TableStructureProps {
    tableName: string;
    table: TableDef;
    onNavigateTable?: (tableName: string) => void;
    className?: string;
}

function getTypeIcon(type: string) {
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return <Type size={14} />;
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float'))
        return <Hash size={14} />;
    if (type.includes('bool')) return <ToggleLeft size={14} />;
    if (type.includes('timestamp') || type.includes('date') || type.includes('time')) return <Calendar size={14} />;
    if (type.includes('enum')) return <List size={14} />;
    if (type.includes('json') || type.includes('array')) return <Cuboid size={14} />;
    return <Type size={14} />;
}

function getTypeColor(type: string): string {
    if (type.includes('text') || type.includes('varchar')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (type.includes('int') || type.includes('numeric')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (type.includes('bool')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    if (type.includes('timestamp')) return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
    if (type.includes('enum')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-neutral-400 bg-neutral-800 border-neutral-700';
}

export function TableStructure({
    tableName,
    table,
    onNavigateTable,
    className,
}: TableStructureProps) {
    const columns = Object.entries(table.columns);
    const relations = table.relations ? Object.entries(table.relations) : [];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className={cn('flex flex-col h-full bg-neutral-950/50', className)}>
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-6 border-b border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-900/50"
            >
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Database size={120} />
                </div>

                <div className="relative z-10 flex items-start gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-900/20"
                    >
                        <Fingerprint size={28} className="text-emerald-400" />
                    </motion.div>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white tracking-tight"
                        >
                            {tableName}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm text-neutral-400 mt-1 max-w-2xl"
                        >
                            {table.description || 'No description provided.'}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-3 mt-4"
                        >
                            <div className="px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 flex items-center gap-2">
                                <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Columns</span>
                                <span className="text-xs font-mono text-emerald-400 font-medium">{columns.length}</span>
                            </div>
                            {relations.length > 0 && (
                                <div className="px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 flex items-center gap-2">
                                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Relations</span>
                                    <span className="text-xs font-mono text-blue-400 font-medium">{relations.length}</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Columns Grid */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 mb-2"
                    >
                        <div className="h-px flex-1 bg-neutral-800"></div>
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Schema Definition</span>
                        <div className="h-px flex-1 bg-neutral-800"></div>
                    </motion.div>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 gap-2"
                    >
                        {columns.map(([name, col], idx) => (
                            <motion.div
                                key={name}
                                variants={item}
                                whileHover={{ scale: 1.01, x: 4, transition: { duration: 0.2 } }}
                                className="group relative flex items-center gap-4 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 hover:bg-neutral-800/60 hover:border-emerald-500/30 transition-colors duration-200"
                            >
                                {/* Index */}
                                <span className="text-[10px] font-mono text-neutral-600 w-6 text-right">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </span>

                                {/* Icon */}
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0", getTypeColor(col.type))}>
                                    {col.primary_key ? <Key size={14} className="text-amber-400" /> : getTypeIcon(col.type)}
                                </div>

                                {/* Name & Type */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-mono text-sm font-medium truncate", col.primary_key ? "text-amber-300" : "text-neutral-200")}>
                                            {name}
                                        </span>
                                        {col.primary_key && <span className="text-[9px] px-1 py-px rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">PK</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-neutral-500 font-mono">{col.type}</span>
                                        {col.enum_name && <span className="text-[10px] text-neutral-600 truncate max-w-[150px]">enum: {col.enum_name}</span>}
                                    </div>
                                </div>

                                {/* Attributes */}
                                <div className="flex items-center gap-2">
                                    {col.unique && (
                                        <div className="p-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10 text-sky-400" title="Unique Constraint">
                                            <Snowflake size={12} />
                                        </div>
                                    )}
                                    {col.nullable === false && !col.primary_key && (
                                        <div className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700" title="Not Null">
                                            <span className="text-[9px] text-neutral-400 font-medium">REQ</span>
                                        </div>
                                    )}
                                    {col.sensitive && (
                                        <div className="p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400" title="Sensitive Data">
                                            <EyeOff size={12} />
                                        </div>
                                    )}
                                    {col.default !== undefined && (
                                        <div className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 max-w-[100px] truncate">
                                            <span className="text-[9px] text-neutral-500 font-mono">def: {String(col.default)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Relations Section */}
                {relations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-4 pt-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-neutral-800"></div>
                            <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Relationships</span>
                            <div className="h-px flex-1 bg-neutral-800"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {relations.map(([relName, rel]) => (
                                <motion.div
                                    key={relName}
                                    onClick={() => onNavigateTable?.(rel.table)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="cursor-pointer group flex flex-col p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/60 hover:bg-neutral-800/40 hover:border-blue-500/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Link2 size={14} className="text-neutral-500 group-hover:text-blue-400 transition-colors" />
                                            <span className="text-xs font-semibold text-neutral-300">{relName}</span>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider border",
                                            rel.type === 'one-to-one' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' :
                                                rel.type === 'one-to-many' ? 'bg-sky-500/5 text-sky-400 border-sky-500/20' :
                                                    rel.type === 'many-to-one' ? 'bg-amber-500/5 text-amber-400 border-amber-500/20' :
                                                        'bg-purple-500/5 text-purple-400 border-purple-500/20'
                                        )}>
                                            {rel.type.replace(/-/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <span className="text-[10px] text-neutral-500 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                                            {rel.foreign_key}
                                        </span>
                                        <ArrowRight size={12} className="text-neutral-600" />
                                        <span className="text-xs font-bold text-blue-400 group-hover:underline">
                                            {rel.table}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
