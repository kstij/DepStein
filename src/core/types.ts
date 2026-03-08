export type Ecosystem = 'npm' | 'pypi' | 'cargo' | 'golang';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type FilterMode = 'all' | 'critical' | 'poor' | 'dev' | 'prod';
export type SortMode = 'score' | 'name' | 'size' | 'updated';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RawDependency {
    name: string;
    version: string;
    ecosystem: Ecosystem;
    isDev: boolean;
}

export interface Vulnerability {
    id: string;
    summary: string;
    severity: SeverityLevel;
    aliases: string[];
}

export interface PackageMetadata {
    name: string;
    ecosystem: Ecosystem;
    latestVersion: string;
    requestedVersion: string;
    publishedAt: Date | null;
    description: string;
    license: string;
    repositoryUrl: string | null;
    weeklyDownloads: number | null;    // npm weekly
    monthlyDownloads: number | null;   // pypi monthly
    totalDownloads: number | null;     // cargo all-time
    unpackedSize: number | null;       // bytes, npm registry unpacked size (fallback)
    gzipSize: number | null;           // bytes, bundlephobia gzipped bundle size (preferred)
    minifiedSize: number | null;       // bytes, bundlephobia minified (pre-gzip)
    hasBuiltinTypes: boolean;          // npm only
    hasTypesPackage: boolean;          // npm only
    vulnerabilities: Vulnerability[];
    fromCache: boolean;
    fetchError: string | null;
}

export interface ScoreDimension {
    name: string;
    score: number;
    maxScore: number;
    reason: string;
}

export interface ScoredDependency {
    raw: RawDependency;
    metadata: PackageMetadata;
    dimensions: {
        maintenance: ScoreDimension;
        popularity: ScoreDimension;
        bundleSize: ScoreDimension;
        typescript: ScoreDimension;
        license: ScoreDimension;
        vulnerability: ScoreDimension;
    };
    totalScore: number;
    grade: Grade;
    issues: string[];
    suggestion: string | null;  // alternative package suggestion
}

export interface ScanResult {
    projectPath: string;
    ecosystem: Ecosystem;
    dependencies: RawDependency[];
}

export interface AuditResult {
    projectPath: string;
    ecosystem: Ecosystem;
    scoredDependencies: ScoredDependency[];
    averageScore: number;
    grade: Grade;
    totalCount: number;
    criticalCount: number;
    poorCount: number;
    fairCount: number;
    goodCount: number;
    excellentCount: number;
    timestamp: string;
}

export interface CLIOptions {
    path: string;
    ecosystem?: Ecosystem;
    filter: FilterMode;
    sort: SortMode;
    noCache: boolean;
    json: boolean;
    top?: number;
    fix: boolean;        // rewrite package.json with better alternatives
    minScore?: number;   // exit 1 if avg score below this threshold (CI mode)
    ci: boolean;         // plain-text + GitHub Actions ::error:: annotations
}

export type CachedMetadata = Omit<PackageMetadata, 'fromCache'> & {
    publishedAt: string | null;
};

export interface CacheEntry {
    data: CachedMetadata;
    timestamp: number;
}

export type CacheStore = Record<string, CacheEntry>;
