import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";
import { type Response } from "@/lib/openapi";

interface ResponseViewProps {
    status: number | null;
    statusText?: string;
    body: any;
    headers?: Record<string, string>;
    className?: string;
    error?: string | null;
}

export function ResponseView({ status, statusText, body, headers, className, error }: ResponseViewProps) {
    if (!status && !error) return null;

    const isSuccess = status && status >= 200 && status < 300;

    return (
        <div className={cn("space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Response</h3>
                {status && (
                    <div className={cn("flex items-center gap-2 text-sm px-2 py-1 rounded bg-neutral-800 border",
                        isSuccess ? "text-green-400 border-green-400/20" : "text-red-400 border-red-400/20"
                    )}>
                        <span className="font-mono font-bold">{status}</span>
                        <span className="text-xs text-neutral-400">{statusText}</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            {body && (
                <div className="space-y-2">
                    <div className="text-xs text-neutral-500">Body</div>
                    <CodeBlock
                        code={typeof body === 'string' ? body : JSON.stringify(body, null, 2)}
                        className="max-h-[400px]"
                    />
                </div>
            )}

            {headers && Object.keys(headers).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="text-xs text-neutral-500">Headers</div>
                    <div className="bg-neutral-950 rounded border border-neutral-800 p-2 font-mono text-xs text-neutral-400 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        {Object.entries(headers).map(([k, v]) => (
                            <>
                                <div className="text-neutral-500 text-right text-nowrap">{k}:</div>
                                <div className="text-neutral-300 break-all">{v}</div>
                            </>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
