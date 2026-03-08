import type {
    PackageMetadata,
    RawDependency,
    ScoredDependency,
    ScoreDimension,
    Grade,
} from './types.js';
import { formatDownloads, formatBytes } from '../utils/format.js';
import { getSuggestedLabel, getBestReplacementPackage } from './replacements.js';

// Re-export for backward compat (index.ts uses getReplacementPackage)
export { getBestReplacementPackage as getReplacementPackage } from './replacements.js';
export { getSuggestedLabel as getSuggestedAlternative } from './replacements.js';


// ── 1. Maintenance (0–20 pts) ─────────────────────────────────────────────────
// Formula: base 20, -10 if last publish > 1 year, -20 if > 2 years

function getMaintenanceScore(metadata: PackageMetadata): ScoreDimension {
    if (!metadata.publishedAt) {
        return { name: 'Maintenance', score: 0, maxScore: 20, reason: 'No publish date available' };
    }

    const daysSince = (Date.now() - metadata.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    let score: number;
    let reason: string;

    if (daysSince <= 30) { score = 20; reason = 'Updated within 30 days'; }
    else if (daysSince <= 90) { score = 18; reason = 'Updated within 90 days'; }
    else if (daysSince <= 180) { score = 16; reason = 'Updated within 6 months'; }
    else if (daysSince <= 365) { score = 10; reason = 'Updated within 1 year'; }   // -10 from max
    else if (daysSince <= 730) { score = 2; reason = 'Updated within 2 years'; }  // -18 ≈ -20
    else {
        const years = (daysSince / 365).toFixed(1);
        score = 0;  // -20
        reason = `Not updated in ${years} years`;
    }

    return { name: 'Maintenance', score, maxScore: 20, reason };
}

// ── 2. Popularity (0–10 pts) ──────────────────────────────────────────────────
// Formula: -5 if < 1000/wk, baseline 5, +5 bonus if > 1M/wk
// Represented as: <100=0, <1000=5, <100K=6, <1M=8, ≥1M=10

function getPopularityScore(metadata: PackageMetadata): ScoreDimension {
    const eco = metadata.ecosystem;

    if (eco === 'npm' && metadata.weeklyDownloads != null) {
        const d = metadata.weeklyDownloads;
        let score: number;
        if (d >= 1_000_000) score = 10;     // +5 bonus tier
        else if (d >= 100_000) score = 8;
        else if (d >= 10_000) score = 7;
        else if (d >= 1_000) score = 5;     // baseline: no penalty
        else if (d >= 100) score = 2;
        else score = 0;                     // -5 penalty tier
        return { name: 'Popularity', score, maxScore: 10, reason: `${formatDownloads(d)}/week` };
    }

    if (eco === 'pypi' && metadata.monthlyDownloads != null) {
        const d = metadata.monthlyDownloads;
        let score: number;
        if (d >= 10_000_000) score = 10;
        else if (d >= 1_000_000) score = 8;
        else if (d >= 100_000) score = 6;
        else if (d >= 10_000) score = 5;
        else if (d >= 1_000) score = 2;
        else score = 0;
        return { name: 'Popularity', score, maxScore: 10, reason: `${formatDownloads(d)}/month` };
    }

    if (eco === 'cargo' && metadata.totalDownloads != null) {
        const d = metadata.totalDownloads;
        let score: number;
        if (d >= 10_000_000) score = 10;
        else if (d >= 1_000_000) score = 8;
        else if (d >= 100_000) score = 6;
        else if (d >= 10_000) score = 5;
        else if (d >= 1_000) score = 2;
        else score = 0;
        return { name: 'Popularity', score, maxScore: 10, reason: `${formatDownloads(d)} total` };
    }

    // golang or missing download data — give benefit of the doubt
    return { name: 'Popularity', score: 5, maxScore: 10, reason: 'Download data unavailable' };
}

// ── 3. Bundle size (0–15 pts, npm only) ───────────────────────────────────────
//
// Two data sources, in preference order:
//  A) bundlephobia gzip size — the ACTUAL browser-visible weight (preferred)
//  B) npm registry unpackedSize — total extracted bytes (10–50× larger, fallback)
//
// Thresholds are calibrated against real npm packages:
//   gzip:        react=6.4KB, lodash=24KB, moment=72KB, chart.js=47KB
//   unpackedSize: react=1.3MB, lodash=1.4MB  (hence separate, wider thresholds)

function getBundleSizeScore(metadata: PackageMetadata): ScoreDimension {
    if (metadata.ecosystem !== 'npm') {
        return { name: 'Bundle Size', score: 15, maxScore: 15, reason: 'N/A (not npm)' };
    }

    // Prefer bundlephobia gzip (real minified+gzipped browser weight)
    if (metadata.gzipSize != null) {
        const kb = metadata.gzipSize / 1024;
        let score: number;
        let tag: string;
        if (kb < 5) { score = 15; tag = 'tiny'; }
        else if (kb < 25) { score = 12; tag = 'small'; }
        else if (kb < 100) { score = 8; tag = 'medium'; }
        else if (kb < 250) { score = 4; tag = 'large'; }
        else if (kb < 500) { score = 2; tag = 'very large'; }
        else { score = 0; tag = 'huge'; }
        return { name: 'Bundle Size', score, maxScore: 15, reason: `${formatBytes(metadata.gzipSize)} gzip (${tag})` };
    }

    // Fallback: npm registry unpackedSize (all source files, much larger)
    if (metadata.unpackedSize != null) {
        const kb = metadata.unpackedSize / 1024;
        let score: number;
        let tag: string;
        if (kb < 10) { score = 15; tag = 'tiny'; }
        else if (kb < 50) { score = 12; tag = 'small'; }
        else if (kb < 200) { score = 8; tag = 'medium'; }
        else if (kb < 500) { score = 4; tag = 'large'; }
        else if (kb < 1024) { score = 2; tag = 'very large'; }
        else { score = 0; tag = 'huge'; }
        return { name: 'Bundle Size', score, maxScore: 15, reason: `${formatBytes(metadata.unpackedSize)} unpacked (${tag})` };
    }

    return { name: 'Bundle Size', score: 8, maxScore: 15, reason: 'Size unknown' };
}

// ── 4. TypeScript support (0–10 pts, npm only) ────────────────────────────────
// Formula: -10 if no types and no @types package

function getTypescriptScore(metadata: PackageMetadata): ScoreDimension {
    if (metadata.ecosystem !== 'npm') {
        return { name: 'TypeScript', score: 10, maxScore: 10, reason: 'N/A (not npm)' };
    }

    if (metadata.hasBuiltinTypes) {
        return { name: 'TypeScript', score: 10, maxScore: 10, reason: 'Built-in types' };
    }

    if (metadata.hasTypesPackage) {
        return { name: 'TypeScript', score: 7, maxScore: 10, reason: `@types/${metadata.name} available` };
    }

    return { name: 'TypeScript', score: 0, maxScore: 10, reason: 'No TypeScript types' };
}

// ── 5. License (0–15 pts) ─────────────────────────────────────────────────────

const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'BSD']);
const PUBLIC_DOMAIN = new Set(['Unlicense', 'CC0-1.0', 'CC0']);
const WEAK_COPYLEFT = new Set(['MPL-2.0', 'LGPL-2.0', 'LGPL-2.1', 'LGPL-3.0']);
const STRONG_COPYLEFT_PATTERNS = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'GPL', 'AGPL'];

function getLicenseScore(metadata: PackageMetadata): ScoreDimension {
    const lic = (metadata.license ?? '').trim();

    if (!lic || lic === 'Unknown' || lic === 'UNKNOWN') {
        return { name: 'License', score: 0, maxScore: 15, reason: 'License unknown' };
    }

    if (PERMISSIVE.has(lic) || lic.startsWith('MIT') || lic.startsWith('Apache') || lic.startsWith('BSD')) {
        return { name: 'License', score: 15, maxScore: 15, reason: `${lic} (permissive)` };
    }

    if (PUBLIC_DOMAIN.has(lic)) {
        return { name: 'License', score: 12, maxScore: 15, reason: `${lic} (public domain)` };
    }

    if (WEAK_COPYLEFT.has(lic) || lic.startsWith('LGPL')) {
        return { name: 'License', score: 10, maxScore: 15, reason: `${lic} (weak copyleft)` };
    }

    if (STRONG_COPYLEFT_PATTERNS.some(p => lic.includes(p))) {
        return { name: 'License', score: 5, maxScore: 15, reason: `${lic} (copyleft)` };
    }

    if (lic.toLowerCase().includes('proprietary') || lic.toLowerCase().includes('commercial')) {
        return { name: 'License', score: 0, maxScore: 15, reason: `${lic} (proprietary)` };
    }

    return { name: 'License', score: 5, maxScore: 15, reason: `${lic} (review needed)` };
}

// ── 6. Vulnerability (0–30 pts) ───────────────────────────────────────────────
// Formula: -30 if any CVE found (proportional: CRITICAL=0, HIGH=3, MEDIUM=15, LOW=22)

function getVulnerabilityScore(metadata: PackageMetadata): ScoreDimension {
    const vulns = metadata.vulnerabilities ?? [];

    if (vulns.length === 0) {
        return { name: 'Security', score: 30, maxScore: 30, reason: 'No known vulnerabilities' };
    }

    const hasCritical = vulns.some(v => v.severity === 'CRITICAL');
    const hasHigh = vulns.some(v => v.severity === 'HIGH');
    const hasMedium = vulns.some(v => v.severity === 'MEDIUM');
    const count = vulns.length;

    if (hasCritical) return { name: 'Security', score: 0, maxScore: 30, reason: `${count} vuln(s), CRITICAL` };
    if (hasHigh) return { name: 'Security', score: 3, maxScore: 30, reason: `${count} vuln(s), HIGH` };
    if (hasMedium) return { name: 'Security', score: 15, maxScore: 30, reason: `${count} vuln(s), MEDIUM` };
    return { name: 'Security', score: 22, maxScore: 30, reason: `${count} vuln(s), LOW` };
}

// ── Grade assignment ───────────────────────────────────────────────────────────

export function getGrade(score: number): Grade {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
}

// ── Issue labels ───────────────────────────────────────────────────────────────

function buildIssues(
    metadata: PackageMetadata,
    dims: ScoredDependency['dimensions'],
): string[] {
    const issues: string[] = [];

    if (dims.maintenance.score === 0) issues.push('abandoned');
    else if (dims.maintenance.score <= 2) issues.push('outdated');

    if (dims.vulnerability.score === 0) issues.push('critical vuln');
    else if (dims.vulnerability.score <= 15) issues.push('vulnerable');

    if (metadata.ecosystem === 'npm' && dims.bundleSize.score === 0) issues.push('huge size');
    if (metadata.ecosystem === 'npm' && dims.typescript.score === 0) issues.push('no types');
    if (dims.license.score === 0) issues.push('license risk');
    if (dims.popularity.score === 0) issues.push('unpopular');
    if (metadata.fetchError) issues.push('fetch error');

    return issues;
}

// ── Main scoring export ────────────────────────────────────────────────────────

export function score(raw: RawDependency, metadata: PackageMetadata): ScoredDependency {
    const dimensions = {
        maintenance: getMaintenanceScore(metadata),
        popularity: getPopularityScore(metadata),
        bundleSize: getBundleSizeScore(metadata),
        typescript: getTypescriptScore(metadata),
        license: getLicenseScore(metadata),
        vulnerability: getVulnerabilityScore(metadata),
    };

    const totalScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0);
    const grade = getGrade(totalScore);
    const issues = buildIssues(metadata, dimensions);
    const suggestion = getSuggestedLabel(raw.name);

    return { raw, metadata, dimensions, totalScore, grade, issues, suggestion };
}
