'use client';

import { cn } from '@/lib/utils';
import { MethodBadge } from '@/components/method-badge';
import { Play } from 'lucide-react';

interface UrlBarProps {
    method: string;
    baseUrl: string;
    path: string;
    onSend: () => void;
    loading?: boolean;
    className?: string;
}

export function UrlBar({ method, baseUrl, path, onSend, loading, className }: UrlBarProps) {
    const fullUrl = baseUrl.startsWith('http') ? baseUrl + path : 'http://localhost:3000' + baseUrl + path;

    return (
        <div className={cn("h-12 bg-neutral-900/50 border-b border-neutral-800 flex items-center gap-3 px-4", className)}>
            {/* Method Badge */}
            <MethodBadge method={method} className="text-xs px-2 py-1 font-bold" />

            {/* URL Display */}
            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 flex items-center">
                <span className="text-sm font-mono text-neutral-300 truncate">{fullUrl}</span>
            </div>

            {/* Send Button */}
            <button
                onClick={onSend}
                disabled={loading}
                className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm transition-all",
                    "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                <Play size={14} fill="currentColor" />
                Send
            </button>
        </div>
    );
}
