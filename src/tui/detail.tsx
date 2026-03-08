import React from 'react';
import { Box, Text } from 'ink';
import type { ScoredDependency, ScoreDimension } from '../core/types.js';
import { gradeColor, scoreColor, severityColor, barColor } from './colors.js';
import { getReplacements } from '../core/replacements.js';
import { getGrade } from '../core/scorer.js';
import { formatRelativeDate, formatBytes } from '../utils/format.js';
import chalk from 'chalk';

interface DetailPanelProps {
    dep: ScoredDependency;
}

function DimensionRow({ dim }: { dim: ScoreDimension }) {
    const pct = dim.score / dim.maxScore;
    const barWidth = 18;
    const filled = Math.round(pct * barWidth);
    const pctScore = Math.round(pct * 100);
    const bar = barColor(pctScore, '█'.repeat(filled)) + chalk.dim('░'.repeat(barWidth - filled));
    const scoreStr = `${dim.score}/${dim.maxScore}`.padStart(6);
    const label = dim.name.padEnd(13);

    // Penalty callout: anything below 70% gets flagged
    const penalized = pctScore < 70;

    return (
        <Box>
            <Text>
                {'  '}
                {penalized ? chalk.hex('#FF8C00').bold(label) : chalk.bold.white(label)}
                {' '}{bar}{' '}
                {scoreColor(pctScore, scoreStr)}
                {'  '}
                {penalized
                    ? chalk.hex('#FF8C00')(`↓ ${dim.reason}`)
                    : chalk.dim(dim.reason)
                }
            </Text>
        </Box>
    );
}

/** Human-readable suggested action for each penalized dimension */
function actionHint(dep: ScoredDependency): string[] {
    const { dimensions, raw, metadata } = dep;
    const hints: string[] = [];

    if (dimensions.maintenance.score <= 3)
        hints.push('⚠  Not actively maintained — consider a fork or alternative');
    else if (dimensions.maintenance.score <= 8)
        hints.push('⏱  Last release was over a year ago — watch for abandonment');

    if (dimensions.typescript.score === 0)
        hints.push('◆  No TypeScript types — add @types/ or find a typed alternative');

    if (dimensions.bundleSize.score <= 2)
        hints.push('◆  Very large bundle — evaluate if this package is worth the size');

    if (dimensions.vulnerability.score <= 4)
        hints.push('⚠  Known vulnerabilities — run `npm audit fix` or update the package');

    if (dimensions.license.score <= 5)
        hints.push('⚠  License may restrict commercial use — review with your legal team');

    if (metadata.latestVersion && metadata.latestVersion !== raw.version)
        hints.push(`↑  New version available: ${raw.version} → ${metadata.latestVersion}`);

    return hints;
}

export function DetailPanel({ dep }: DetailPanelProps) {
    const { raw, metadata, dimensions, totalScore, grade } = dep;
    // suggestion is pre-computed by the scorer and stored in ScoredDependency
    const alternative = dep.suggestion;
    const hints = actionHint(dep);

    // Download stat label
    const dlLabel = metadata.ecosystem === 'npm'
        ? metadata.weeklyDownloads != null ? `${(metadata.weeklyDownloads / 1000).toFixed(1)}K/wk downloads` : null
        : metadata.ecosystem === 'pypi'
            ? metadata.monthlyDownloads != null ? `${(metadata.monthlyDownloads / 1000).toFixed(1)}K/mo downloads` : null
            : metadata.ecosystem === 'cargo'
                ? metadata.totalDownloads != null ? `${(metadata.totalDownloads / 1000000).toFixed(1)}M total downloads` : null
                : null;

    return (
        <Box flexDirection="column" paddingX={2} paddingY={0}>
            {/* ── Title row ── */}
            <Box gap={2}>
                <Text bold color="white">{raw.name}</Text>
                <Text dimColor>{raw.version}</Text>
                <Text>{scoreColor(totalScore, `${totalScore}/100`)}</Text>
                <Text>{gradeColor(grade)}</Text>
                <Text dimColor>{raw.isDev ? '[dev]' : '[prod]'}</Text>
                {metadata.fromCache && <Text dimColor>[cached]</Text>}
            </Box>

            {/* ── Description ── */}
            {metadata.description && (
                <Box marginTop={0}>
                    <Text dimColor wrap="wrap">{metadata.description}</Text>
                </Box>
            )}

            {/* ── Stats row ── */}
            <Box marginTop={1} gap={3}>
                <Text>
                    <Text dimColor>license  </Text>
                    <Text bold color="white">{metadata.license || 'Unknown'}</Text>
                </Text>
                <Text>
                    <Text dimColor>updated  </Text>
                    <Text bold color="white">{formatRelativeDate(metadata.publishedAt)}</Text>
                </Text>
                {dlLabel && (
                    <Text>
                        <Text dimColor>downloads  </Text>
                        <Text bold color="white">{dlLabel}</Text>
                    </Text>
                )}
                {/* Show gzip (bundlephobia) as primary size; fall back to npm unpacked size */}
                {metadata.gzipSize != null ? (
                    <Text>
                        <Text dimColor>bundle  </Text>
                        <Text bold color="white">{formatBytes(metadata.gzipSize)} gzip</Text>
                        {metadata.minifiedSize != null && (
                            <Text dimColor>  ({formatBytes(metadata.minifiedSize)} min)</Text>
                        )}
                    </Text>
                ) : metadata.unpackedSize != null ? (
                    <Text>
                        <Text dimColor>size  </Text>
                        <Text bold color="white">{formatBytes(metadata.unpackedSize)} unpacked</Text>
                    </Text>
                ) : null}
            </Box>

            {metadata.repositoryUrl && (
                <Box>
                    <Text dimColor>repo  </Text>
                    <Text color="cyan">{metadata.repositoryUrl}</Text>
                </Box>
            )}

            {/* ── Score breakdown ── */}
            <Box marginTop={1} flexDirection="column">
                <Text bold color="white">Score Breakdown</Text>
                <DimensionRow dim={dimensions.maintenance} />
                <DimensionRow dim={dimensions.popularity} />
                <DimensionRow dim={dimensions.bundleSize} />
                <DimensionRow dim={dimensions.typescript} />
                <DimensionRow dim={dimensions.license} />
                <DimensionRow dim={dimensions.vulnerability} />
            </Box>

            {/* ── Vulnerabilities ── */}
            {metadata.vulnerabilities.length > 0 && (
                <Box marginTop={1} flexDirection="column">
                    <Text bold color="redBright">Vulnerabilities ({metadata.vulnerabilities.length})</Text>
                    {metadata.vulnerabilities.slice(0, 5).map(v => (
                        <Box key={v.id}>
                            <Text>
                                {'  '}{severityColor(v.severity)}{'  '}
                                <Text bold>{v.id}</Text>
                                {'  '}
                                <Text dimColor>{v.summary.slice(0, 60)}{v.summary.length > 60 ? '…' : ''}</Text>
                            </Text>
                        </Box>
                    ))}
                    {metadata.vulnerabilities.length > 5 && (
                        <Text dimColor>  …and {metadata.vulnerabilities.length - 5} more</Text>
                    )}
                </Box>
            )}

            {/* ── Action hints ── */}
            {hints.length > 0 && (
                <Box marginTop={1} flexDirection="column">
                    <Text bold color="white">Suggested Actions</Text>
                    {hints.map((h, i) => (
                        <Box key={i}>
                            <Text color="#e04a1a">  {h}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* ── Replacements ── */}
            {(() => {
                const replacements = getReplacements(raw.name);
                if (!replacements || replacements.length === 0) {
                    return alternative ? (
                        <Box marginTop={0}>
                            <Text dimColor>  Consider replacing with </Text>
                            <Text bold color="cyan">{alternative}</Text>
                        </Box>
                    ) : null;
                }
                const [first, ...rest] = replacements;
                const renderLine = (r: (typeof replacements)[0], prefix: string) => {
                    const rGrade = getGrade(r.approxScore);
                    return (
                        <Box key={r.name}>
                            <Text>
                                {'  '}
                                <Text color="cyan">{prefix} </Text>
                                <Text bold color="white">{r.label}</Text>
                                {'  ('}
                                <Text>{scoreColor(r.approxScore, `${r.approxScore}/100`)}</Text>
                                {' '}
                                <Text>{gradeColor(rGrade)}</Text>
                                {')'}
                                {r.savesKbGzip != null && (
                                    <Text color="green">  — saves {r.savesKbGzip}KB gzip</Text>
                                )}
                                {r.reason ? <Text dimColor>  {r.reason}</Text> : null}
                            </Text>
                        </Box>
                    );
                };
                return (
                    <Box marginTop={1} flexDirection="column">
                        <Text bold color="white">Replace with</Text>
                        {renderLine(first, '→')}
                        {rest.slice(0, 2).map(r => renderLine(r, '  or:'))}
                    </Box>
                );
            })()}

            {/* ── Fetch error ── */}
            {metadata.fetchError && (
                <Box marginTop={1}>
                    <Text color="red">Fetch error: {metadata.fetchError}</Text>
                </Box>
            )}

            <Box marginTop={1}>
                <Text dimColor>[esc] or [enter] → back to list</Text>
            </Box>
        </Box>
    );
}
