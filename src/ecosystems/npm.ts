import { fetchJson } from '../utils/http.js';
import { cache } from '../core/cache.js';
import { fetchVulnerabilities } from '../core/vulnerabilities.js';
import { fetchHead } from '../utils/http.js';
import type { PackageMetadata } from '../core/types.js';

interface NpmRegistryPackage {
    name?: string;
    description?: string;
    license?: string;
    repository?: { url?: string };
    'dist-tags'?: Record<string, string>;
    versions?: Record<string, NpmVersionData>;
    time?: Record<string, string>;
}

interface NpmVersionData {
    version?: string;
    license?: string;
    types?: string;
    typings?: string;
    repository?: { url?: string };
    dist?: { unpackedSize?: number };
}

interface NpmDownloads {
    downloads?: number;
}

interface BundlephobiaResult {
    gzip?: number;
    size?: number;
    name?: string;
    version?: string;
    error?: string;
}

export async function fetchNpm(
    name: string,
    requestedVersion: string,
    noCache: boolean,
): Promise<PackageMetadata> {
    if (!noCache) {
        const cached = cache.get('npm', name);
        if (cached) return { ...cached, fromCache: true };
    }

    try {
        const encodedName = encodeURIComponent(name).replace('%40', '@');

        const [registryResult, downloadsResult] = await Promise.allSettled([
            fetchJson(`https://registry.npmjs.org/${encodedName}`) as Promise<NpmRegistryPackage>,
            fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodedName}`) as Promise<NpmDownloads>,
        ]);

        if (registryResult.status === 'rejected') {
            throw new Error(String(registryResult.reason));
        }

        const registry = registryResult.value;
        const downloads = downloadsResult.status === 'fulfilled' ? downloadsResult.value : null;

        const latestVersion = registry['dist-tags']?.latest ?? requestedVersion;
        const versionData: NpmVersionData = registry.versions?.[latestVersion] ?? {};
        const publishedAt = registry.time?.[latestVersion] ? new Date(registry.time[latestVersion]) : null;

        const hasBuiltinTypes = !!(versionData.types || versionData.typings);

        // Check for @types/{name} on npm (strip scope prefix for scoped packages)
        const unscoped = name.startsWith('@') ? name.split('/')[1] : name;
        const hasTypesPackage = hasBuiltinTypes
            ? false
            : await fetchHead(`https://registry.npmjs.org/@types%2F${encodeURIComponent(unscoped ?? name)}`);

        const rawRepo = versionData.repository?.url ?? registry.repository?.url ?? null;
        const repositoryUrl = rawRepo
            ? rawRepo.replace(/^git\+/, '').replace(/\.git$/, '')
            : null;

        // Fetch real bundle sizes from bundlephobia (minified + gzip).
        // Bundlephobia gives the actual browser-visible weight, which is far
        // smaller than npm's unpackedSize (total extracted file bytes).
        const bundleResult = await (
            fetchJson(
                `https://bundlephobia.com/api/size?package=${encodedName}@${latestVersion}`,
            ) as Promise<BundlephobiaResult>
        ).catch(() => null as BundlephobiaResult | null);

        const gzipSize = bundleResult?.gzip ?? null;
        const minifiedSize = bundleResult?.size ?? null;

        const vulnerabilities = await fetchVulnerabilities(name, 'npm', latestVersion);

        const metadata: Omit<PackageMetadata, 'fromCache'> = {
            name,
            ecosystem: 'npm',
            latestVersion,
            requestedVersion,
            publishedAt,
            description: registry.description ?? '',
            license: versionData.license ?? registry.license ?? 'Unknown',
            repositoryUrl,
            weeklyDownloads: downloads?.downloads ?? null,
            monthlyDownloads: null,
            totalDownloads: null,
            unpackedSize: versionData.dist?.unpackedSize ?? null,
            gzipSize,
            minifiedSize,
            hasBuiltinTypes,
            hasTypesPackage,
            vulnerabilities,
            fetchError: null,
        };

        cache.set('npm', name, metadata);
        return { ...metadata, fromCache: false };
    } catch (err) {
        return failedMetadata(name, 'npm', requestedVersion, (err as Error).message);
    }
}

function failedMetadata(
    name: string,
    ecosystem: PackageMetadata['ecosystem'],
    requestedVersion: string,
    error: string,
): PackageMetadata {
    return {
        name,
        ecosystem,
        latestVersion: requestedVersion,
        requestedVersion,
        publishedAt: null,
        description: '',
        license: 'Unknown',
        repositoryUrl: null,
        weeklyDownloads: null,
        monthlyDownloads: null,
        totalDownloads: null,
        unpackedSize: null,
        gzipSize: null,
        minifiedSize: null,
        hasBuiltinTypes: false,
        hasTypesPackage: false,
        vulnerabilities: [],
        fromCache: false,
        fetchError: error,
    };
}

interface NpmRegistryPackage {
    name?: string;
    description?: string;
    license?: string;
    repository?: { url?: string };
    'dist-tags'?: Record<string, string>;
    versions?: Record<string, NpmVersionData>;
    time?: Record<string, string>;
}

interface NpmVersionData {
    version?: string;
    license?: string;
    types?: string;
    typings?: string;
    repository?: { url?: string };
    dist?: { unpackedSize?: number };
}

interface NpmDownloads {
    downloads?: number;
}
