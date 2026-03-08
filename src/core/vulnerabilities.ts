import { fetchJson } from '../utils/http.js';
import type { Vulnerability, SeverityLevel, Ecosystem } from './types.js';

/**
 * Ecosystem name mappings for OSV API
 * https://osv.dev/docs/#section/Background
 */
const OSV_ECOSYSTEM: Record<Ecosystem, string> = {
    npm: 'npm',
    pypi: 'PyPI',
    cargo: 'crates.io',
    golang: 'Go',
};

interface OsvVuln {
    id: string;
    summary?: string;
    aliases?: string[];
    severity?: Array<{ type: string; score: string }>;
    database_specific?: {
        severity?: string;
        cvss?: { score?: number };
    };
    ecosystem_specific?: { severity?: string };
}

interface OsvResponse {
    vulns?: OsvVuln[];
}

/** Map a CVSS numeric base score (0–10) to our severity tiers. */
function cvssScoreToSeverity(score: number): SeverityLevel {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
}

/**
 * Resolve severity using a three-tier strategy:
 * 1. Explicit string from database_specific.severity (GitHub Advisory / NVD)
 * 2. Numeric CVSS score from database_specific.cvss.score
 * 3. ecosystem_specific.severity string
 * 4. Fall back to LOW (conservative unknown)
 */
function resolveSeverity(v: OsvVuln): SeverityLevel {
    // Tier 1: string severity from authoritative database fields
    for (const raw of [v.database_specific?.severity, v.ecosystem_specific?.severity]) {
        if (!raw) continue;
        const s = raw.toUpperCase();
        if (s === 'CRITICAL') return 'CRITICAL';
        if (s === 'HIGH') return 'HIGH';
        if (s === 'MEDIUM' || s === 'MODERATE') return 'MEDIUM';
        if (s === 'LOW') return 'LOW';
    }
    // Tier 2: numeric CVSS score
    const cvssScore = v.database_specific?.cvss?.score;
    if (cvssScore != null && cvssScore > 0) {
        return cvssScoreToSeverity(cvssScore);
    }
    return 'LOW';
}

/**
 * Returns true if the version string looks like a concrete resolved version
 * (i.e. not a semver range like ^1.0, ~1.0, >=1.0, etc.)
 */
function isConcreteVersion(version: string): boolean {
    return /^\d+\.\d+/.test(version);
}

export async function fetchVulnerabilities(
    name: string,
    ecosystem: Ecosystem,
    /** Resolved/installed version — enables version-aware filtering so only
     *  vulns that affect THIS version are returned (not all historical CVEs). */
    version: string | null = null,
): Promise<Vulnerability[]> {
    try {
        const pkgQuery: Record<string, string> = {
            name,
            ecosystem: OSV_ECOSYSTEM[ecosystem],
        };

        const body: Record<string, unknown> = { package: pkgQuery };

        // Pass the concrete installed version so OSV returns only CVEs that
        // affect the version the user actually has installed.  Range selectors
        // (^, ~, >) are not valid OSV version strings — skip them.
        if (version && isConcreteVersion(version)) {
            body.version = version;
        }

        const res = (await fetchJson('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })) as OsvResponse;

        if (!res.vulns || !Array.isArray(res.vulns)) return [];

        return res.vulns.slice(0, 20).map(v => ({
            id: v.id,
            summary: v.summary ?? 'No description available',
            severity: resolveSeverity(v),
            aliases: v.aliases ?? [],
        }));
    } catch {
        // Never let vulnerability check crash the whole audit
        return [];
    }
}
