import React from 'react';
import { Box, Text } from 'ink';
import type { ScoredDependency } from '../core/types.js';
import { gradeColor, scoreColor, issueColor } from './colors.js';
import { truncate, padEnd } from '../utils/format.js';
import chalk from 'chalk';

// Column widths
const COL = {
    name: 26,
    ver: 9,
    score: 8,
    grade: 6,
    issue: 28,
};

const DIVIDER_WIDTH = COL.name + COL.ver + COL.score + COL.grade + COL.issue + 4;

interface TableProps {
    deps: ScoredDependency[];
    selectedIndex: number;
    scrollOffset: number;
    visibleRows: number;
}

function RowSelected({ dep }: { dep: ScoredDependency }) {
    const name = padEnd(truncate(dep.raw.name, COL.name), COL.name);
    const ver = padEnd(truncate(dep.raw.version, COL.ver), COL.ver);
    const scoreStr = padEnd(`${dep.totalScore}/100`, COL.score);
    const gradeStr = padEnd(dep.grade, COL.grade);
    const firstIssue = dep.issues[0] ?? '';
    const issue = truncate(firstIssue, COL.issue);
    const cached = dep.metadata.fromCache ? ' ◆' : '';
    const BG = '#0a1628';

    return (
        <Box>
            <Text backgroundColor={BG} color="#e04a1a"> › </Text>
            <Text backgroundColor={BG} bold color="white">{name} </Text>
            <Text backgroundColor={BG} color="#aaaaaa">{ver}</Text>
            <Text backgroundColor={BG} bold color="white">{scoreStr}</Text>
            <Text backgroundColor={BG} bold color="white">  {gradeStr}</Text>
            <Text backgroundColor={BG} color="#e04a1a">{issue || '—'}</Text>
            <Text backgroundColor={BG} dimColor>{cached} </Text>
        </Box>
    );
}

function RowNormal({ dep }: { dep: ScoredDependency }) {
    const name = padEnd(truncate(dep.raw.name, COL.name), COL.name);
    const ver = padEnd(truncate(dep.raw.version, COL.ver), COL.ver);
    const scoreStr = padEnd(`${dep.totalScore}/100`, COL.score);
    const gradeStr = padEnd(dep.grade, COL.grade);
    const firstIssue = dep.issues[0] ?? '';
    const issue = truncate(firstIssue, COL.issue);
    const cached = dep.metadata.fromCache ? chalk.dim(' ◆') : ' ';

    const coloredScore = scoreColor(dep.totalScore, scoreStr);
    const coloredGrade = gradeColor(dep.grade) + ' '.repeat(Math.max(0, COL.grade - dep.grade.length - 1));
    const coloredIssue = firstIssue ? issueColor(issue) : chalk.dim('—');

    return (
        <Box>
            <Text>
                {'   '}{chalk.white(name)}{' '}{chalk.dim(ver)}
                {coloredScore}{'  '}{coloredGrade}{' '}{coloredIssue}{cached}{' '}
            </Text>
        </Box>
    );
}

export function Table({ deps, selectedIndex, scrollOffset, visibleRows }: TableProps) {
    const visible = deps.slice(scrollOffset, scrollOffset + visibleRows);

    return (
        <Box flexDirection="column">
            {/* Column header */}
            <Box paddingX={1}>
                <Text bold color="white">
                    {'   '}
                    {padEnd('PACKAGE', COL.name)}{' '}
                    {padEnd('VER', COL.ver)}
                    {padEnd('SCORE', COL.score)}
                    {'  '}
                    {padEnd('GRADE', COL.grade)}
                    {' ISSUE'}
                </Text>
            </Box>

            {/* Divider */}
            <Box paddingX={1}>
                <Text dimColor>{'   '}{'─'.repeat(DIVIDER_WIDTH)}</Text>
            </Box>

            {/* Rows */}
            {visible.map((dep, i) => {
                const globalIdx = scrollOffset + i;
                const selected = globalIdx === selectedIndex;
                return (
                    <React.Fragment key={dep.raw.name}>
                        {selected ? <RowSelected dep={dep} /> : <RowNormal dep={dep} />}
                    </React.Fragment>
                );
            })}

            {/* Scroll indicator */}
            {deps.length > visibleRows && (
                <Box paddingX={4}>
                    <Text dimColor>
                        {scrollOffset + visibleRows < deps.length
                            ? `↓ ${deps.length - scrollOffset - visibleRows} more`
                            : '─ end ─'}
                    </Text>
                </Box>
            )}
        </Box>
    );
}


