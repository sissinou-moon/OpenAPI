'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
    direction: 'horizontal' | 'vertical';
    defaultSize?: number; // percentage for first panel
    minSize?: number; // minimum percentage
    maxSize?: number; // maximum percentage
    storageKey?: string; // localStorage key for persistence
    children: [React.ReactNode, React.ReactNode];
    className?: string;
}

export function ResizablePanel({
    direction,
    defaultSize = 25,
    minSize = 10,
    maxSize = 80,
    storageKey,
    children,
    className
}: ResizablePanelProps) {
    const [size, setSize] = useState(() => {
        if (storageKey && typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved) return parseFloat(saved);
        }
        return defaultSize;
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    }, [direction]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newSize: number;

        if (direction === 'horizontal') {
            newSize = ((e.clientX - rect.left) / rect.width) * 100;
        } else {
            newSize = ((e.clientY - rect.top) / rect.height) * 100;
        }

        newSize = Math.max(minSize, Math.min(maxSize, newSize));
        setSize(newSize);
    }, [direction, minSize, maxSize]);

    const handleMouseUp = useCallback(() => {
        if (isDragging.current) {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            if (storageKey) {
                localStorage.setItem(storageKey, size.toString());
            }
        }
    }, [size, storageKey]);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex overflow-hidden",
                isHorizontal ? "flex-row" : "flex-col",
                className
            )}
        >
            {/* First Panel */}
            <div
                style={isHorizontal ? { width: `${size}%` } : { height: `${size}%` }}
                className="overflow-hidden shrink-0"
            >
                {children[0]}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    "shrink-0 bg-neutral-800 hover:bg-emerald-500/50 transition-colors z-10",
                    isHorizontal
                        ? "w-1 cursor-col-resize hover:w-1"
                        : "h-1 cursor-row-resize hover:h-1",
                    isDragging.current && "bg-emerald-500"
                )}
            />

            {/* Second Panel */}
            <div className="flex-1 overflow-hidden">
                {children[1]}
            </div>
        </div>
    );
}
