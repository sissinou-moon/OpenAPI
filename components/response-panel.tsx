'use client';

import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/ui/code-block';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ResponsePanelProps {
    exampleResponse?: any;
    liveResponse?: {
        status: number;
        statusText: string;
        body: any;
        error?: string;
    } | null;
    loading?: boolean;
    className?: string;
}

export function ResponsePanel({ exampleResponse, liveResponse, loading, className }: ResponsePanelProps) {
    const hasLiveResponse = liveResponse !== null && liveResponse !== undefined;
    const displayData = hasLiveResponse ? liveResponse.body : exampleResponse;
    const isSuccess = hasLiveResponse && liveResponse.status >= 200 && liveResponse.status < 300;
    const isError = hasLiveResponse && (liveResponse.status >= 400 || liveResponse.error);

    return (
        <div className={cn("h-full flex flex-col bg-neutral-950", className)}>
            {/* Header */}
            <div className="h-10 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-neutral-400">
                    {hasLiveResponse ? 'Response' : 'Example Response'}
                </span>
                {loading && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Clock size={12} className="animate-spin" />
                        Loading...
                    </div>
                )}
                {hasLiveResponse && !loading && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded",
                        isSuccess ? "text-green-400 bg-green-400/10" :
                            isError ? "text-red-400 bg-red-400/10" :
                                "text-neutral-400"
                    )}>
                        {isSuccess && <CheckCircle2 size={12} />}
                        {isError && <XCircle size={12} />}
                        {liveResponse.status} {liveResponse.statusText}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {liveResponse?.error ? (
                    <div className="p-4 text-red-400 text-sm">
                        <p className="font-medium mb-1">Error</p>
                        <p className="text-xs text-red-300">{liveResponse.error}</p>
                    </div>
                ) : displayData ? (
                    <CodeBlock
                        code={typeof displayData === 'string' ? displayData : JSON.stringify(displayData, null, 2)}
                        className="h-full rounded-none border-none text-xs"
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                        No response data
                    </div>
                )}
            </div>
        </div>
    );
}
