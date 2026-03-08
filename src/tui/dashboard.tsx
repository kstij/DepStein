import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { writeFileSync } from 'fs';
import { join } from 'path';
import type {
    ScanResult,
    ScoredDependency,
    AuditResult,
    FilterMode,
    SortMode,
    CLIOptions,
} from '../core/types.js';
import { fetchAll } from '../core/fetcher.js';
import { score as scoreOne, getGrade } from '../core/scorer.js';
import { Table } from './table.js';
import { Summary } from './summary.js';
import { DetailPanel } from './detail.js';
import { gradeColor, scoreColor } from './colors.js';
import { progressBar } from '../utils/format.js';
import chalk from 'chalk';

// ── Constants ──────────────────────────────────────────────────────────────────

const FILTER_CYCLE: FilterMode[] = ['all', 'critical', 'poor', 'dev', 'prod'];
const SORT_CYCLE: SortMode[] = ['score', 'name', 'size', 'updated'];

const FILTER_LABELS: Record<FilterMode, string> = {
    all: 'All',
    critical: 'Critical',
    poor: 'Poor',
    dev: 'Dev only',
    prod: 'Prod only',
};

const SORT_LABELS: Record<SortMode, string> = {
    score: 'Score',
    name: 'Name',
    size: 'Size',
    updated: 'Updated',
};

// ── Loading screen ─────────────────────────────────────────────────────────────

interface LoadingProps {
    total: number;
    done: number;
    current: string;
    ecosystem: string;
}

function LoadingScreen({ total, done, current, ecosystem }: LoadingProps) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const barWidth = 30;
    const filled = total > 0 ? Math.round((done / total) * barWidth) : 0;
    const bar =
        chalk.cyan('█'.repeat(filled)) +
        chalk.dim('░'.repeat(barWidth - filled));

    return (
        <Box flexDirection="column" padding={1}>
            <Box gap={2}>
                <Text bold color="cyan">DEPSCORE</Text>
                <Text color="#e04a1a">v0.1.0</Text>
                <Text dimColor>[{ecosystem}]</Text>
            </Box>
            <Box marginTop={1}>
                <Text dimColor>Fetching  </Text>
                <Text>{bar}</Text>
                <Text>  </Text>
                <Text color="cyan">{done}</Text>
                <Text dimColor>/{total}</Text>
                <Text dimColor>  {pct}%</Text>
            </Box>
            {current && (
                <Box>
                    <Text dimColor>  → </Text>
                    <Text color="white">{current}</Text>
                </Box>
            )}
        </Box>
    );
}

// ── Filter menu ────────────────────────────────────────────────────────────────

interface FilterMenuProps {
    current: FilterMode;
    onSelect: (f: FilterMode) => void;
    onClose: () => void;
}

function FilterMenu({ current, onSelect, onClose }: FilterMenuProps) {
    const [cursor, setCursor] = useState(FILTER_CYCLE.indexOf(current));

    useInput((input, key) => {
        if (key.upArrow) setCursor(c => (c - 1 + FILTER_CYCLE.length) % FILTER_CYCLE.length);
        if (key.downArrow) setCursor(c => (c + 1) % FILTER_CYCLE.length);
        if (key.return) { onSelect(FILTER_CYCLE[cursor]); onClose(); }
        if (input === 'f' || input === 'q' || key.escape) onClose();
    });

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} width={30}>
            <Text bold color="white">Filter</Text>
            {FILTER_CYCLE.map((f, i) => (
                <Box key={f}>
                    <Text>
                        {i === cursor ? chalk.hex('#e04a1a')('› ') : '  '}
                        {i === cursor ? chalk.bold.white(FILTER_LABELS[f]) : chalk.dim(FILTER_LABELS[f])}
                        {f === current ? chalk.green(' ✓') : ''}
                    </Text>
                </Box>
            ))}
            <Box marginTop={1}>
                <Text dimColor>[↑↓] navigate  [enter] select  [esc] cancel</Text>
            </Box>
        </Box>
    );
}

// ── Apply filter & sort ────────────────────────────────────────────────────────

function applyFilter(deps: ScoredDependency[], filter: FilterMode): ScoredDependency[] {
    switch (filter) {
        case 'critical': return deps.filter(d => d.grade === 'F');
        case 'poor': return deps.filter(d => d.grade === 'D' || d.grade === 'F');
        case 'dev': return deps.filter(d => d.raw.isDev);
        case 'prod': return deps.filter(d => !d.raw.isDev);
        default: return deps;
    }
}

function applySort(deps: ScoredDependency[], sort: SortMode): ScoredDependency[] {
    return [...deps].sort((a, b) => {
        switch (sort) {
            case 'score':
                return a.totalScore - b.totalScore; // ascending: worst first
            case 'name':
                return a.raw.name.localeCompare(b.raw.name);
            case 'size':
                return (b.metadata.unpackedSize ?? 0) - (a.metadata.unpackedSize ?? 0);
            case 'updated': {
                const ta = a.metadata.publishedAt?.getTime() ?? 0;
                const tb = b.metadata.publishedAt?.getTime() ?? 0;
                return ta - tb; // ascending: oldest first
            }
        }
    });
}

// ── Build AuditResult ──────────────────────────────────────────────────────────

function buildAuditResult(scanResult: ScanResult, scored: ScoredDependency[]): AuditResult {
    const avg = scored.length > 0
        ? scored.reduce((s, d) => s + d.totalScore, 0) / scored.length
        : 0;

    return {
        projectPath: scanResult.projectPath,
        ecosystem: scanResult.ecosystem,
        scoredDependencies: scored,
        averageScore: avg,
        grade: getGrade(Math.round(avg)),
        totalCount: scored.length,
        criticalCount: scored.filter(d => d.grade === 'F').length,
        poorCount: scored.filter(d => d.grade === 'D').length,
        fairCount: scored.filter(d => d.grade === 'C').length,
        goodCount: scored.filter(d => d.grade === 'B').length,
        excellentCount: scored.filter(d => d.grade === 'A').length,
        timestamp: new Date().toISOString(),
    };
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

interface DashboardProps {
    scanResult: ScanResult;
    options: CLIOptions;
}

export function Dashboard({ scanResult, options }: DashboardProps) {
    const { exit } = useApp();

    // Loading state
    const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
    const [loadDone, setLoadDone] = useState(0);
    const [loadCurrent, setLoadCurrent] = useState('');

    // Data
    const [allScored, setAllScored] = useState<ScoredDependency[]>([]);
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

    // View state
    const [filterMode, setFilterMode] = useState<FilterMode>(options.filter ?? 'all');
    const [sortMode, setSortMode] = useState<SortMode>(options.sort ?? 'score');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [showDetail, setShowDetail] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [exportMsg, setExportMsg] = useState<string | null>(null);

    // Terminal dimensions
    const termHeight = process.stdout.rows ?? 24;
    // Header (~4) + Summary (~3) + Footer (~2) + dividers = ~12 overhead
    const TABLE_OVERHEAD = 12;
    const visibleRows = Math.max(5, termHeight - TABLE_OVERHEAD);

    // ── Fetch on mount ───────────────────────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;

        const total = scanResult.dependencies.length;

        (async () => {
            const results = await fetchAll(
                scanResult.dependencies,
                options.noCache,
                (done, _total, current) => {
                    if (!cancelled) {
                        setLoadDone(done);
                        setLoadCurrent(current);
                    }
                },
            );

            if (cancelled) return;

            const scored = results.map((meta, i) =>
                scoreOne(scanResult.dependencies[i], meta),
            );

            const result = buildAuditResult(scanResult, scored);

            setAllScored(scored);
            setAuditResult(result);
            setPhase('ready');
        })();

        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived display list ─────────────────────────────────────────────────────

    const displayDeps: ScoredDependency[] = React.useMemo(() => {
        let list = applyFilter(allScored, filterMode);
        list = applySort(list, sortMode);
        if (options.top) list = list.slice(0, options.top);
        return list;
    }, [allScored, filterMode, sortMode, options.top]);

    // Clamp selected index when list changes
    useEffect(() => {
        setSelectedIndex(idx => Math.min(idx, Math.max(0, displayDeps.length - 1)));
        setScrollOffset(0);
    }, [displayDeps.length]);

    // ── Keyboard input ───────────────────────────────────────────────────────────

    useInput((input, key) => {
        if (phase !== 'ready') return;
        if (showFilter) return; // FilterMenu handles its own input

        if (showDetail) {
            if (key.return || key.escape || input === 'q') setShowDetail(false);
            return;
        }

        if (input === 'q') { exit(); return; }

        if (key.upArrow) {
            setSelectedIndex(idx => {
                const next = Math.max(0, idx - 1);
                if (next < scrollOffset) setScrollOffset(next);
                return next;
            });
        }

        if (key.downArrow) {
            setSelectedIndex(idx => {
                const next = Math.min(displayDeps.length - 1, idx + 1);
                if (next >= scrollOffset + visibleRows) setScrollOffset(next - visibleRows + 1);
                return next;
            });
        }

        if (key.return) {
            if (displayDeps[selectedIndex]) setShowDetail(true);
        }

        if (input === 'f') setShowFilter(true);

        if (input === 's') {
            setSortMode(m => {
                const idx = SORT_CYCLE.indexOf(m);
                return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
            });
            setSelectedIndex(0);
            setScrollOffset(0);
        }

        if (input === 'e' && auditResult) {
            try {
                const path = join(process.cwd(), `depscore-report-${Date.now()}.json`);
                writeFileSync(path, JSON.stringify(auditResult, null, 2), 'utf-8');
                setExportMsg(`Exported → ${path}`);
                setTimeout(() => setExportMsg(null), 3000);
            } catch (err) {
                setExportMsg(`Export failed: ${(err as Error).message}`);
                setTimeout(() => setExportMsg(null), 3000);
            }
        }
    });

    // ── Render: Loading ──────────────────────────────────────────────────────────

    if (phase === 'loading') {
        return (
            <LoadingScreen
                total={scanResult.dependencies.length}
                done={loadDone}
                current={loadCurrent}
                ecosystem={scanResult.ecosystem}
            />
        );
    }

    if (!auditResult) return null;

    // ── Render: Filter menu overlay ──────────────────────────────────────────────

    if (showFilter) {
        return (
            <Box flexDirection="column">
                {renderHeader(scanResult)}
                <FilterMenu
                    current={filterMode}
                    onSelect={m => { setFilterMode(m); setSelectedIndex(0); setScrollOffset(0); }}
                    onClose={() => setShowFilter(false)}
                />
            </Box>
        );
    }

    // ── Render: Detail panel ─────────────────────────────────────────────────────

    const selectedDep = displayDeps[selectedIndex];

    if (showDetail && selectedDep) {
        return (
            <Box flexDirection="column">
                {renderHeader(scanResult)}
                <Box marginTop={0} flexDirection="column">
                    <DetailPanel dep={selectedDep} />
                </Box>
            </Box>
        );
    }

    // ── Render: Main dashboard ───────────────────────────────────────────────────

    return (
        <Box flexDirection="column">
            {renderHeader(scanResult)}

            {/* Summary bar */}
            <Box borderStyle="single" borderColor="gray" paddingX={1} marginX={0}>
                <Summary result={auditResult} />
            </Box>

            {/* Table */}
            <Box borderStyle="single" borderColor="gray" flexDirection="column">
                <Table
                    deps={displayDeps}
                    selectedIndex={selectedIndex}
                    scrollOffset={scrollOffset}
                    visibleRows={visibleRows}
                />
            </Box>

            {/* Footer */}
            <Box paddingX={1} flexDirection="column">
                <Text dimColor>
                    {chalk.dim('[↑↓]')} navigate  {chalk.dim('[enter]')} details  {chalk.dim('[f]')} filter:{' '}
                    <Text color="#e04a1a">{FILTER_LABELS[filterMode]}</Text>
                    {'  '}{chalk.dim('[s]')} sort: <Text color="#e04a1a">{SORT_LABELS[sortMode]}</Text>
                    {'  '}{chalk.dim('[e]')} export  {chalk.dim('[q]')} quit
                </Text>
                {exportMsg && <Text color="green">{exportMsg}</Text>}
                {options.top && (
                    <Text dimColor>Showing top {options.top} worst packages</Text>
                )}
            </Box>
        </Box>
    );
}

function renderHeader(scanResult: ScanResult) {
    const { projectPath, ecosystem } = scanResult;
    const shortPath = projectPath.replace(process.env.HOME ?? '', '~');

    return (
        <Box flexDirection="column">
            {/* ASCII brand in compact single line */}
            <Box paddingX={2} paddingTop={0}>
                <Text bold color="cyan">{'██████╗ ███████╗██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗'}</Text>
            </Box>
            <Box paddingX={2}>
                <Text bold color="cyan">{'██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝'}</Text>
            </Box>
            <Box paddingX={2}>
                <Text bold color="cyan">{'██║  ██║█████╗  ██████╔╝███████╗██║     ██║   ██║██████╔╝█████╗  '}</Text>
            </Box>
            <Box paddingX={2}>
                <Text bold color="cyan">{'██║  ██║██╔══╝  ██╔═══╝ ╚════██║██║     ██║   ██║██╔══██╗██╔══╝  '}</Text>
            </Box>
            <Box paddingX={2}>
                <Text bold color="cyan">{'██████╔╝███████╗██║     ███████║╚██████╗╚██████╔╝██║  ██║███████╗'}</Text>
            </Box>
            <Box paddingX={2} paddingBottom={0}>
                <Text bold color="cyan">{'╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝'}</Text>
            </Box>
            {/* Info bar below the ASCII art */}
            <Box paddingX={2} gap={2}>
                <Text color="#e04a1a">v0.1.0</Text>
                <Text dimColor>{shortPath}</Text>
                <Text bold color="cyan">[{ecosystem}]</Text>
            </Box>
        </Box>
    );
}
