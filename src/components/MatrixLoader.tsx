// src/components/MatrixLoader.tsx
import React, { useState, useEffect } from 'react';

const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$+-*/= γίνειਅਤੇკიCDΕϜЅΟΡԚѦԧЗИѲԮԖԘЯ"; // Add more if you like

interface MatrixLoaderProps {
    text?: string;
    lines?: number;
    charsPerLine?: number;
}

const MatrixLoader: React.FC<MatrixLoaderProps> = ({
                                                       text = "LOADING DATA...",
                                                       lines = 5,
                                                       charsPerLine = 30
                                                   }) => {
    const [displayText, setDisplayText] = useState<string[]>([]);

    useEffect(() => {
        const generateLine = () => {
            let line = '';
            for (let i = 0; i < charsPerLine; i++) {
                line += matrixChars[Math.floor(Math.random() * matrixChars.length)];
            }
            return line;
        };

        const initialLines = Array(lines).fill("").map(() => generateLine());
        // Place the actual text in the middle line (or a few lines)
        const middleLineIndex = Math.floor(lines / 2);
        initialLines[middleLineIndex] = text.padEnd(charsPerLine, ' '); // Pad to maintain width

        if (lines > 2 && middleLineIndex > 0) { // Add some more gibberish if more lines
            initialLines[middleLineIndex -1] = generateLine();
        }
        if (lines > 3 && middleLineIndex < lines -1 ) {
            initialLines[middleLineIndex +1] = generateLine();
        }


        setDisplayText(initialLines);

        const intervalId = setInterval(() => {
            setDisplayText(prevLines => {
                const newLines = prevLines.map((line, index) => {
                    if (index === middleLineIndex && line.startsWith(text.padEnd(charsPerLine, ' '))) { // Keep the loading text line mostly stable but flicker ends
                        const prefix = text;
                        let suffix = '';
                        for (let i = 0; i < charsPerLine - prefix.length; i++) {
                            suffix += matrixChars[Math.floor(Math.random() * matrixChars.length)];
                        }
                        return prefix + suffix;
                    }
                    return generateLine();
                });
                return newLines;
            });
        }, 150); // Adjust speed of character change

        return () => clearInterval(intervalId);
    }, [text, lines, charsPerLine]);

    return (
        <div className="text-center p-4">
            {displayText.map((line, index) => (
                <p key={index} className="font-mono text-sm text-[#00cc66] whitespace-pre leading-tight break-all">
                    {line}
                </p>
            ))}
        </div>
    );
};

export default MatrixLoader;