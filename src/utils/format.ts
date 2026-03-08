// ── Number formatting ──────────────────────────────────────────────────────────

export function formatDownloads(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

export function formatBytes(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)}KB`;
    return `${bytes}B`;
}

export function formatScore(score: number): string {
    return `${score}/100`;
}

// ── Date formatting ────────────────────────────────────────────────────────────

export function formatRelativeDate(date: Date | null): string {
    if (!date) return 'unknown';
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths > 0) return `${years}y ${remainingMonths}mo ago`;
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export function formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ── String helpers ─────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + '…';
}

export function padEnd(str: string, len: number): string {
    return str.padEnd(len).slice(0, len);
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

export function progressBar(value: number, max: number, width: number = 20): string {
    const ratio = Math.min(value / max, 1);
    const filled = Math.round(ratio * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

export function progressBarPercent(value: number, total: number, width: number = 20): string {
    return progressBar(value, total, width);
}
