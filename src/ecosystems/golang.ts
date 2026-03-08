import { fetchJson } from '../utils/http.js';
import { cache } from '../core/cache.js';
import { fetchVulnerabilities } from '../core/vulnerabilities.js';
import type { PackageMetadata } from '../core/types.js';

interface GoProxyLatest {
    Version?: string;
    Time?: string;
    Origin?: { Hash?: string; Ref?: string };
}

interface GoSumdbInfo {
    version?: string;
    time?: string;
}

/**
 * For GitHub-hosted Go modules we fetch additional metadata via the GitHub API.
 */
interface GitHubRepo {
    description?: string;
    license?: { spdx_id?: string; name?: string };
    stargazers_count?: number;
    html_url?: string;
}

function extractGithubPath(module: string): string | null {
    const m = module.match(/^github\.com\/([^/]+\/[^/]+)/);
    return m ? m[1] : null;
}

export async function fetchGolang(
    name: string,
    requestedVersion: string,
    noCache: boolean,
): Promise<PackageMetadata> {
    if (!noCache) {
        const cached = cache.get('golang', name);
        if (cached) return { ...cached, fromCache: true };
    }

    try {
        // URL-encode the module path for the proxy: '@' and '/' need special handling
        const encodedModule = name
            .split('/')
            .map(s => encodeURIComponent(s))
            .join('/');

        // Fetch latest version info from Go module proxy
        const proxyResult = await (fetchJson(
            `https://proxy.golang.org/${encodedModule}/@latest`,
        ) as Promise<GoProxyLatest>).catch(() => null as GoProxyLatest | null);

        const specificResult =
            requestedVersion && requestedVersion !== 'latest'
                ? await (fetchJson(
                    `https://proxy.golang.org/${encodedModule}/@v/${encodeURIComponent(requestedVersion)}.info`,
                ) as Promise<GoSumdbInfo>).catch(() => null as GoSumdbInfo | null)
                : null;

        const latestVersion =
            proxyResult?.Version ?? specificResult?.version ?? requestedVersion;
        const rawTime = proxyResult?.Time ?? specificResult?.time ?? null;
        const publishedAt = rawTime ? new Date(rawTime) : null;

        // Try GitHub API for richer metadata
        let description = '';
        let license = 'Unknown';
        let repositoryUrl: string | null = null;

        const githubPath = extractGithubPath(name);
        if (githubPath) {
            repositoryUrl = `https://github.com/${githubPath}`;
            const ghResult = await (fetchJson(
                `https://api.github.com/repos/${githubPath}`,
            ) as Promise<GitHubRepo>).catch(() => null as GitHubRepo | null);

            if (ghResult) {
                description = ghResult.description ?? '';
                license = ghResult.license?.spdx_id ?? ghResult.license?.name ?? 'Unknown';
                repositoryUrl = ghResult.html_url ?? repositoryUrl;
            }
        }

        const vulnerabilities = await fetchVulnerabilities(name, 'golang', latestVersion);

        const metadata: Omit<PackageMetadata, 'fromCache'> = {
            name,
            ecosystem: 'golang',
            latestVersion,
            requestedVersion,
            publishedAt,
            description,
            license,
            repositoryUrl,
            weeklyDownloads: null,
            monthlyDownloads: null,
            totalDownloads: null,
            unpackedSize: null,
            gzipSize: null,
            minifiedSize: null,
            hasBuiltinTypes: false,
            hasTypesPackage: false,
            vulnerabilities,
            fetchError: null,
        };

        cache.set('golang', name, metadata);
        return { ...metadata, fromCache: false };
    } catch (err) {
        return {
            name,
            ecosystem: 'golang',
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
