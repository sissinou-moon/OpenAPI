'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Operation, Schema, BodyRow } from '@/lib/openapi';
import { CodeBlock } from '@/components/ui/code-block';
import { generateCurl, generateNode } from '@/lib/code-generator';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';



interface RequestPanelProps {
    operation: Operation | null;
    baseUrl: string;
    path: string;
    method: string;
    bodyRows: BodyRow[];
    bearerToken: string;
    onBodyRowsChange: (rows: BodyRow[]) => void;
    onBearerTokenChange: (token: string) => void;
    className?: string;
}

export function RequestPanel({
    operation,
    baseUrl,
    path,
    method,
    bodyRows,
    bearerToken,
    onBodyRowsChange,
    onBearerTokenChange,
    className
}: RequestPanelProps) {
    const [activeTab, setActiveTab] = useState<'body' | 'auth'>('body');
    const [codeTab, setCodeTab] = useState<'curl' | 'node'>('curl');

    if (!operation) {
        return (
            <div className={cn("h-full flex items-center justify-center text-neutral-500", className)}>
                Select a route to view details
            </div>
        );
    }

    const addRow = () => {
        onBodyRowsChange([...bodyRows, { key: '', value: '', type: 'string', enabled: true }]);
    };

    const updateRow = (index: number, field: keyof BodyRow, value: string | boolean) => {
        const updated = [...bodyRows];
        updated[index] = { ...updated[index], [field]: value } as BodyRow;
        onBodyRowsChange(updated);
    };

    const removeRow = (index: number) => {
        onBodyRowsChange(bodyRows.filter((_, i) => i !== index));
    };

    // Generate body object from rows
    const bodyObject: Record<string, any> = {};
    bodyRows.filter(r => r.enabled && r.key).forEach(r => {
        let val: any = r.value;
        if (r.type === 'number') {
            val = Number(r.value);
        } else if (r.type === 'boolean') {
            val = r.value.toLowerCase() === 'true';
        } else if (r.type === 'json') {
            try {
                val = JSON.parse(r.value);
            } catch (e) {
                val = r.value; // Fallback to string
            }
        }
        bodyObject[r.key] = val;
    });

    const fullUrl = baseUrl.startsWith('http') ? baseUrl + path : 'http://localhost:3000' + baseUrl + path;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    return (
        <div className={cn("h-full flex flex-col bg-neutral-950 overflow-hidden", className)}>
            {/* Responses Section */}
            <div className="p-3 border-b border-neutral-800">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Responses</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(operation.responses).map(([status, resp]) => (
                        <div
                            key={status}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded text-xs border",
                                status.startsWith('2')
                                    ? "text-green-400 border-green-400/30 bg-green-400/10"
                                    : "text-red-400 border-red-400/30 bg-red-400/10"
                            )}
                        >
                            {status.startsWith('2') ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            <span className="font-mono font-bold">{status}</span>
                            <span className="text-neutral-500 hidden sm:inline"> {resp.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body / Auth Tabs */}
            <div className="flex border-b border-neutral-800">
                <button
                    onClick={() => setActiveTab('body')}
                    className={cn(
                        "px-4 py-2 text-xs font-medium transition-colors",
                        activeTab === 'body'
                            ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/30"
                            : "text-neutral-500 hover:text-neutral-300"
                    )}
                >
                    Body
                </button>
                <button
                    onClick={() => setActiveTab('auth')}
                    className={cn(
                        "px-4 py-2 text-xs font-medium transition-colors",
                        activeTab === 'auth'
                            ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/30"
                            : "text-neutral-500 hover:text-neutral-300"
                    )}
                >
                    Auth
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'body' && (
                    <div className="p-3">
                        {/* Body Table */}
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-neutral-500 text-left">
                                    <th className="pb-2 w-8"></th>
                                    <th className="pb-2 font-medium">Key</th>
                                    <th className="pb-2 font-medium">Type</th>
                                    <th className="pb-2 font-medium">Value</th>
                                    <th className="pb-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, i) => (
                                    <tr key={i} className="group">
                                        <td className="py-1 pr-2">
                                            <input
                                                type="checkbox"
                                                checked={row.enabled}
                                                onChange={(e) => updateRow(i, 'enabled', e.target.checked)}
                                                className="accent-emerald-500"
                                            />
                                        </td>
                                        <td className="py-1 pr-2">
                                            <input
                                                type="text"
                                                value={row.key}
                                                onChange={(e) => updateRow(i, 'key', e.target.value)}
                                                placeholder="key"
                                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 focus:border-emerald-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="py-1 pr-2">
                                            <select
                                                value={row.type}
                                                onChange={(e) => updateRow(i, 'type', e.target.value)}
                                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-[10px] text-neutral-400 focus:border-emerald-500 focus:outline-none appearance-none"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="json">JSON/Array</option>
                                            </select>
                                        </td>
                                        <td className="py-1 pr-2">
                                            <input
                                                type="text"
                                                value={row.value}
                                                onChange={(e) => updateRow(i, 'value', e.target.value)}
                                                placeholder={row.type === 'json' ? '[1, 2, 3]' : 'value'}
                                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 focus:border-emerald-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="py-1">
                                            <button
                                                onClick={() => removeRow(i)}
                                                className="p-1 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            onClick={addRow}
                            className="mt-2 flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
                        >
                            <Plus size={12} /> Add Row
                        </button>
                    </div>
                )}

                {activeTab === 'auth' && (
                    <div className="p-3">
                        <label className="block text-xs text-neutral-400 mb-2">Bearer Token</label>
                        <input
                            type="text"
                            value={bearerToken}
                            onChange={(e) => onBearerTokenChange(e.target.value)}
                            placeholder="Enter your token"
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-300 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Code Examples */}
            <div className="border-t border-neutral-800">
                <div className="flex border-b border-neutral-800">
                    <button
                        onClick={() => setCodeTab('curl')}
                        className={cn(
                            "px-3 py-1.5 text-[10px] font-medium transition-colors",
                            codeTab === 'curl'
                                ? "text-emerald-400 bg-emerald-950/30"
                                : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        cURL
                    </button>
                    <button
                        onClick={() => setCodeTab('node')}
                        className={cn(
                            "px-3 py-1.5 text-[10px] font-medium transition-colors",
                            codeTab === 'node'
                                ? "text-emerald-400 bg-emerald-950/30"
                                : "text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        Node.js
                    </button>
                </div>
                <CodeBlock
                    code={codeTab === 'curl'
                        ? generateCurl(fullUrl, method, headers, Object.keys(bodyObject).length > 0 ? bodyObject : undefined)
                        : generateNode(fullUrl, method, headers, Object.keys(bodyObject).length > 0 ? bodyObject : undefined)
                    }
                    className="text-[10px] max-h-32 overflow-auto rounded-none border-none"
                />
            </div>
        </div>
    );
}
