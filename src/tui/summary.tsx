import React from 'react';
import { Box, Text } from 'ink';
import type { AuditResult } from '../core/types.js';
import { gradeColor, scoreColor, gradeDistBar } from './colors.js';

interface SummaryProps {
    result: AuditResult;
}

export function Summary({ result }: SummaryProps) {
    const {
        totalCount, averageScore, grade,
        criticalCount, poorCount, fairCount, goodCount, excellentCount,
    } = result;

    const distBar = gradeDistBar(excellentCount, goodCount, fairCount, poorCount, criticalCount, 32);
    const needsAttention = criticalCount + poorCount + fairCount;
    const allHealthy = needsAttention === 0;

    return (
        <Box flexDirection="column" paddingX={1}>
            {/* Stat row */}
            <Box gap={3}>
                <Text>
                    <Text bold color="white">{totalCount}</Text>
                    <Text dimColor> {totalCount === 1 ? 'dependency' : 'dependencies'}</Text>
                </Text>
                <Text>
                    <Text dimColor>avg </Text>
                    <Text>{scoreColor(averageScore, `${Math.round(averageScore)}/100`)}</Text>
                </Text>
                <Text>
                    <Text dimColor>grade </Text>
                    <Text>{gradeColor(grade)}</Text>
                </Text>
                {excellentCount > 0 && <Text color="greenBright">{excellentCount}×A</Text>}
                {goodCount > 0 && <Text color="#9ACD32">{goodCount}×B</Text>}
                {fairCount > 0 && <Text color="yellow">{fairCount}×C</Text>}
                {poorCount > 0 && <Text color="#FF8C00">{poorCount}×D</Text>}
                {criticalCount > 0 && <Text color="redBright">{criticalCount}×F</Text>}
            </Box>

            {/* Grade distribution bar */}
            <Box marginTop={0}>
                <Text>{distBar}</Text>
            </Box>

            {/* Health status */}
            <Box marginTop={0}>
                {allHealthy
                    ? <Text color="greenBright">✓ All dependencies healthy</Text>
                    : <Text color="redBright">⚠ {needsAttention} package{needsAttention !== 1 ? 's' : ''} need{needsAttention === 1 ? 's' : ''} attention</Text>
                }
            </Box>
        </Box>
    );
}
