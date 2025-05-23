// src/components/SegmentedDialLoader.tsx
import React, { useEffect, useState, CSSProperties } from 'react';

interface SegmentedDialLoaderProps {
    segments?: number;      // number of arcs around the dial (default 8)
    intervalMs?: number;    // speed of illumination (ms)
    size?: number;          // SVG viewport size (px)
    litColor?: string;      // colour of lit arc
    unlitColor?: string;    // colour of un‑lit arc (use transparent for invisible)
    arcRatio?: number;      // 0–1 visible fraction of each slice (smaller → sparser)
}

/**
 * SegmentedDialLoader – Matrix‑style sparse radial loader.
 * Lights one arc at a time until full, then resets.
 */
const SegmentedDialLoader: React.FC<SegmentedDialLoaderProps> = ({
                                                                     segments = 8,               // **half as many**
                                                                     intervalMs = 120,
                                                                     size = 180,
                                                                     litColor = '#00ff66',
                                                                     unlitColor = 'transparent',
                                                                     arcRatio = 0.11,           // keeps absolute arc length similar to previous 16×0.22
                                                                 }) => {
    const [litSegments, setLitSegments] = useState(0);

    /* ticker */
    useEffect(() => {
        const id = setInterval(() => {
            setLitSegments(prev => (prev + 1) % (segments + 1));
        }, intervalMs);
        return () => clearInterval(id);
    }, [segments, intervalMs]);

    /* geometry */
    const r = size * 0.38;               // radius of path centre‑line
    const strokeW = size * 0.07;         // **200 % thicker** radially
    const slice = (2 * Math.PI) / segments;
    const arcLen = slice * arcRatio;

    const glow: CSSProperties = { filter: `drop-shadow(0 0 6px ${litColor})` };

    const arcPath = (start: number, end: number) => {
        const x1 = r * Math.cos(start);
        const y1 = r * Math.sin(start);
        const x2 = r * Math.cos(end);
        const y2 = r * Math.sin(end);
        return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            className="mx-auto my-12"
        >
            {Array.from({ length: segments }).map((_, i) => {
                const center = i * slice - Math.PI / 2; // 12 o'clock ref
                const start = center - arcLen / 2;
                const end = center + arcLen / 2;
                const lit = i < litSegments;
                return (
                    <path
                        key={i}
                        d={arcPath(start, end)}
                        fill="none"
                        stroke={lit ? litColor : unlitColor}
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        style={lit ? glow : undefined}
                    />
                );
            })}
        </svg>
    );
};

export default SegmentedDialLoader;
