import { fetchJson } from '../utils/http.js';
import { cache } from '../core/cache.js';
import { fetchVulnerabilities } from '../core/vulnerabilities.js';
import type { PackageMetadata } from '../core/types.js';

interface PypiInfo {
    info: {
        name: string;
        version: string;
        summary?: string;
        license?: string;
        requires_python?: string;
        project_urls?: Record<string, string>;
        home_page?: string;
        classifiers?: string[];
    };
    releases?: Record<string, Array<{ upload_time: string }>>;
    urls?: Array<{ upload_time: string }>;
}

interface PypiStats {
    data?: {
        last_month?: number;
        last_week?: number;
        last_day?: number;
    };
}

export async function fetchPypi(
    name: string,
    requestedVersion: string,
    noCache: boolean,
): Promise<PackageMetadata> {
    if (!noCache) {
        const cached = cache.get('pypi', name);
        if (cached) return { ...cached, fromCache: true };
    }

    try {
        const [infoResult, statsResult] = await Promise.allSettled([
            fetchJson(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`) as Promise<PypiInfo>,
            fetchJson(
                `https://pypistats.org/api/packages/${encodeURIComponent(name.toLowerCase())}/recent`,
            ) as Promise<PypiStats>,
        ]);

        if (infoResult.status === 'rejected') {
            throw new Error(String(infoResult.reason));
        }

        const pkg = infoResult.value;
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;

        const latestVersion = pkg.info.version;
        const latestReleases = pkg.releases?.[latestVersion] ?? pkg.urls ?? [];
        const lastRelease = latestReleases[latestReleases.length - 1];
        const publishedAt = lastRelease?.upload_time ? new Date(lastRelease.upload_time + 'Z') : null;

        const urls = pkg.info.project_urls ?? {};
        const repositoryUrl =
            urls['Source Code'] ??
            urls['Source'] ??
            urls['Repository'] ??
            urls['GitHub'] ??
            urls['Homepage'] ??
            pkg.info.home_page ??
            null;

        const vulnerabilities = await fetchVulnerabilities(name, 'pypi', latestVersion);

        const metadata: Omit<PackageMetadata, 'fromCache'> = {
            name,
            ecosystem: 'pypi',
            latestVersion,
            requestedVersion,
            publishedAt,
            description: pkg.info.summary ?? '',
            license: pkg.info.license ?? 'Unknown',
            repositoryUrl,
            weeklyDownloads: null,
            monthlyDownloads: stats?.data?.last_month ?? null,
            totalDownloads: null,
            unpackedSize: null,
            gzipSize: null,
            minifiedSize: null,
            hasBuiltinTypes: false,
            hasTypesPackage: false,
            vulnerabilities,
            fetchError: null,
        };

        cache.set('pypi', name, metadata);
        return { ...metadata, fromCache: false };
    } catch (err) {
        return {
            name,
            ecosystem: 'pypi',
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
