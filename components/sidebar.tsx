
import { cn } from "@/lib/utils";
import { type OpenAPISpec, type PathItem } from "@/lib/openapi";
import { MethodBadge } from "@/components/method-badge";

interface SidebarProps {
    spec: OpenAPISpec | null;
    selectedPath: string;
    selectedMethod: string;
    onSelect: (path: string, method: string) => void;
    className?: string;
}

export function Sidebar({ spec, selectedPath, selectedMethod, onSelect, className }: SidebarProps) {
    if (!spec) return null;

    return (
        <div className={cn("h-full w-full bg-neutral-900 overflow-y-auto border-r border-neutral-800", className)}>
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="font-semibold text-lg text-emerald-500 truncate">{spec.info.title}</h2>
                <p className="text-sm text-neutral-500 truncate">{spec.info.description}</p>
            </div>

            <div className="p-2 space-y-1">
                {Object.entries(spec.paths).map(([path, details]) => (
                    <div key={path} className="group">
                        <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1 mt-3 first:mt-1">
                            {path}
                        </div>
                        {Object.entries(details).map(([method, op]) => {
                            if (method === 'parameters' || method === 'servers') return null;
                            const isActive = selectedPath === path && selectedMethod === method;

                            return (
                                <button
                                    key={`${path}-${method}`}
                                    onClick={() => onSelect(path, method)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-sm transition-colors",
                                        isActive ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                                    )}
                                >
                                    <span className="truncate mr-2 font-mono text-xs">{op.summary || path}</span>
                                    <MethodBadge method={method} className="text-[10px] px-1.5 py-0.5 ml-auto" />
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {spec.errors && (
                <div className="p-4 mt-4 border-t border-neutral-800">
                    <h3 className="text-emerald-500 text-sm font-semibold mb-2 uppercase">Possible Errors</h3>
                    <div className="space-y-2">
                        {Object.entries(spec.errors).map(([code, err]) => (
                            <div key={code} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">{code}</span>
                                <span className="text-neutral-400">{err.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
