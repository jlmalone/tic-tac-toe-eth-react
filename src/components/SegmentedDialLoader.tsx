// src/components/SegmentedDialLoader.tsx
import React, { useEffect, useState, CSSProperties } from 'react';

interface SegmentedDialLoaderProps {
    segments?: number;      // number of ticks around the dial (default 12)
    intervalMs?: number;    // speed of illumination (ms)
    size?: number;          // SVG viewport size (px)
    litColor?: string;      // colour of lit tick
    unlitColor?: string;    // colour of un‑lit tick (use transparent for invisible)
    tickLength?: number;    // length of each tick
    tickWidth?: number;     // width of each tick
}

/**
 * SegmentedDialLoader – Matrix‑style rectangular tick loader.
 * Lights one tick at a time until full, then resets.
 */
const SegmentedDialLoader: React.FC<SegmentedDialLoaderProps> = ({
                                                                     segments = 9,
                                                                     intervalMs = 500,
                                                                     size = 180,
                                                                     litColor = '#00ff66',
                                                                     unlitColor = '#001b03',
                                                                     tickLength = size * 0.13,    // length of tick (radial direction)
                                                                     tickWidth = size * 0.06,     // width of tick (tangential direction)
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
    const centerRadius = size * 0.35;    // distance from center to middle of tick
    const slice = (2 * Math.PI) / segments;

    const glow: CSSProperties = { filter: `drop-shadow(0 0 6px ${litColor})` };

    const createTickPath = (index: number) => {
        const angle = index * slice - Math.PI / 2; // 12 o'clock reference
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Calculate the four corners of the rectangular tick
        const innerRadius = centerRadius - tickLength / 2;
        const outerRadius = centerRadius + tickLength / 2;

        // Perpendicular direction for width
        const perpCos = -sin;  // perpendicular to radial direction
        const perpSin = cos;

        const halfWidth = tickWidth / 2;

        // Four corners of the rectangle
        const x1 = innerRadius * cos - halfWidth * perpCos;
        const y1 = innerRadius * sin - halfWidth * perpSin;

        const x2 = outerRadius * cos - halfWidth * perpCos;
        const y2 = outerRadius * sin - halfWidth * perpSin;

        const x3 = outerRadius * cos + halfWidth * perpCos;
        const y3 = outerRadius * sin + halfWidth * perpSin;

        const x4 = innerRadius * cos + halfWidth * perpCos;
        const y4 = innerRadius * sin + halfWidth * perpSin;

        return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            className="mx-auto my-12"
        >
            {Array.from({ length: segments }).map((_, i) => {
                const lit = i < litSegments;
                return (
                    <path
                        key={i}
                        d={createTickPath(i)}
                        fill={lit ? litColor : unlitColor}
                        stroke="none"
                        style={lit ? glow : undefined}
                    />
                );
            })}
        </svg>
    );
};

export default SegmentedDialLoader;