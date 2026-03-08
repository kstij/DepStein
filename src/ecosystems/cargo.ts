import { fetchJson } from '../utils/http.js';
import { cache } from '../core/cache.js';
import { fetchVulnerabilities } from '../core/vulnerabilities.js';
import type { PackageMetadata } from '../core/types.js';

interface CratesResponse {
    crate?: {
        id: string;
        name: string;
        newest_version: string;
        updated_at: string;
        downloads: number;
        description?: string;
        documentation?: string;
        repository?: string;
        homepage?: string;
    };
    versions?: Array<{
        num: string;
        license?: string;
        updated_at: string;
    }>;
}

export async function fetchCargo(
    name: string,
    requestedVersion: string,
    noCache: boolean,
): Promise<PackageMetadata> {
    if (!noCache) {
        const cached = cache.get('cargo', name);
        if (cached) return { ...cached, fromCache: true };
    }

    try {
        const data = (await fetchJson(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`, {
            headers: {
                // crates.io requires a descriptive User-Agent
                'User-Agent': 'depscore/0.1.0 (https://github.com/depscore/depscore)',
            },
        })) as CratesResponse;

        if (!data.crate) {
            throw new Error(`Crate "${name}" not found on crates.io`);
        }

        const krate = data.crate;
        const latestVersion = krate.newest_version;

        // Extract license from the matching version entry
        const versionEntry = data.versions?.find(v => v.num === latestVersion);
        const license = versionEntry?.license ?? 'Unknown';
        const updatedAt = versionEntry?.updated_at ?? krate.updated_at;

        const vulnerabilities = await fetchVulnerabilities(name, 'cargo', latestVersion);

        const metadata: Omit<PackageMetadata, 'fromCache'> = {
            name,
            ecosystem: 'cargo',
            latestVersion,
            requestedVersion,
            publishedAt: updatedAt ? new Date(updatedAt) : null,
            description: krate.description ?? '',
            license,
            repositoryUrl: krate.repository ?? krate.homepage ?? krate.documentation ?? null,
            weeklyDownloads: null,
            monthlyDownloads: null,
            totalDownloads: krate.downloads,
            unpackedSize: null,
            gzipSize: null,
            minifiedSize: null,
            hasBuiltinTypes: false,
            hasTypesPackage: false,
            vulnerabilities,
            fetchError: null,
        };

        cache.set('cargo', name, metadata);
        return { ...metadata, fromCache: false };
    } catch (err) {
        return {
            name,
            ecosystem: 'cargo',
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
            fetchError: (err as Error).message,
        };
    }
}
