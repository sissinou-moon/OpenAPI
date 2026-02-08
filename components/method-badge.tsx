import { cn } from "@/lib/utils";

interface MethodBadgeProps {
    method: string;
    className?: string;
}

const methodColors: Record<string, string> = {
    get: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    post: "text-green-400 bg-green-400/10 border-green-400/20",
    put: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    delete: "text-red-400 bg-red-400/10 border-red-400/20",
    patch: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    options: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    head: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
    const lowerMethod = method.toLowerCase();
    const colorClass = methodColors[lowerMethod] || "text-gray-400 bg-gray-400/10 border-gray-400/20";

    return (
        <span className={cn("px-2 py-0.5 text-xs font-medium rounded border uppercase", colorClass, className)}>
            {method}
        </span>
    );
}
