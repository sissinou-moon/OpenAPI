'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this alias works, if not "lib/utils"

interface CodeBlockProps {
    code: string;
    language?: string;
    className?: string;
}

export function CodeBlock({ code, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("relative group rounded-md overflow-hidden bg-neutral-950 border border-neutral-800", className)}>
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-neutral-300 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                <code>{code}</code>
            </pre>
        </div>
    );
}
