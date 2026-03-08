import chalk from 'chalk';
import type { Grade } from '../core/types.js';

export const ACCENT = '#e04a1a';

export function gradeColor(grade: Grade): string {
    switch (grade) {
        case 'A': return chalk.greenBright(grade);
        case 'B': return chalk.hex('#9ACD32')(grade);   // yellow-green
        case 'C': return chalk.yellow(grade);
        case 'D': return chalk.hex('#FF8C00')(grade);   // orange
        case 'F': return chalk.redBright(grade);
    }
}

export function scoreColor(score: number, text?: string | number): string {
    const t = String(text ?? score);
    if (score >= 90) return chalk.greenBright(t);
    if (score >= 75) return chalk.green(t);
    if (score >= 60) return chalk.yellow(t);
    return chalk.red(t);
}

/**
 * Color an issue label with an icon prefix.
 * vulnerable / abandoned → red ⚠
 * no types / huge size  → yellow ◆
 * outdated / license    → orange ◆
 */
export function issueColor(issue: string): string {
    const lower = issue.toLowerCase();
    if (lower.includes('vuln') || lower.includes('critical')) return chalk.redBright(`⚠ ${issue}`);
    if (lower.includes('abandoned')) return chalk.redBright(`⚠ ${issue}`);
    if (lower.includes('no types')) return chalk.yellow(`◆ ${issue}`);
    if (lower.includes('huge size')) return chalk.yellow(`◆ ${issue}`);
    if (lower.includes('outdated')) return chalk.hex('#FF8C00')(`◆ ${issue}`);
    if (lower.includes('license')) return chalk.hex('#FF8C00')(`◆ ${issue}`);
    return chalk.dim(issue);
}

export function severityColor(severity: string): string {
    switch (severity.toUpperCase()) {
        case 'CRITICAL': return chalk.bgRed.white(' CRITICAL ');
        case 'HIGH': return chalk.redBright('HIGH');
        case 'MEDIUM': return chalk.yellow('MEDIUM');
        default: return chalk.dim('LOW');
    }
}

export function barColor(score: number, bar: string): string {
    if (score >= 90) return chalk.greenBright(bar);
    if (score >= 75) return chalk.green(bar);
    if (score >= 60) return chalk.yellow(bar);
    if (score >= 30) return chalk.hex('#FF8C00')(bar);
    return chalk.red(bar);
}

/**
 * Grade-distribution bar — each segment colored by its grade bucket.
 */
export function gradeDistBar(
    excellent: number, good: number, fair: number, poor: number, critical: number,
    width: number = 30,
): string {
    const total = excellent + good + fair + poor + critical;
    if (total === 0) return chalk.dim('░'.repeat(width));

    const seg = (count: number, colorFn: (s: string) => string): string => {
        const len = Math.max(0, Math.round((count / total) * width));
        return colorFn('█'.repeat(len));
    };

    const raw =
        seg(excellent, chalk.greenBright) +
        seg(good, chalk.hex('#9ACD32')) +
        seg(fair, chalk.yellow) +
        seg(poor, chalk.hex('#FF8C00')) +
        seg(critical, chalk.redBright);

    // Pad to exactly `width` visible cells if segments don't fill due to rounding
    const bare = raw.replace(/\x1B\[[0-9;]*m/g, '');
    const diff = width - bare.length;
    if (diff > 0) return raw + chalk.dim('░'.repeat(diff));
    return raw;
}
