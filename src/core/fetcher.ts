import { fetchNpm } from '../ecosystems/npm.js';
import { fetchPypi } from '../ecosystems/pypi.js';
import { fetchCargo } from '../ecosystems/cargo.js';
import { fetchGolang } from '../ecosystems/golang.js';
import type { RawDependency, PackageMetadata } from './types.js';

const BATCH_SIZE = 10;

export type ProgressCallback = (done: number, total: number, current: string) => void;

async function fetchOne(dep: RawDependency, noCache: boolean): Promise<PackageMetadata> {
    switch (dep.ecosystem) {
        case 'npm': return fetchNpm(dep.name, dep.version, noCache);
        case 'pypi': return fetchPypi(dep.name, dep.version, noCache);
        case 'cargo': return fetchCargo(dep.name, dep.version, noCache);
        case 'golang': return fetchGolang(dep.name, dep.version, noCache);
    }
}

/**
 * Fetch metadata for all dependencies in parallel batches.
 * Never throws — individual failures are captured in metadata.fetchError.
 */
export async function fetchAll(
    deps: RawDependency[],
    noCache: boolean,
    onProgress?: ProgressCallback,
): Promise<PackageMetadata[]> {
    let done = 0;
    const results: PackageMetadata[] = new Array(deps.length);

    for (let i = 0; i < deps.length; i += BATCH_SIZE) {
        const batch = deps.slice(i, i + BATCH_SIZE);

        await Promise.all(
            batch.map(async (dep, batchIdx) => {
                const globalIdx = i + batchIdx;
                onProgress?.(done, deps.length, dep.name);

                try {
                    results[globalIdx] = await fetchOne(dep, noCache);
                } catch (err) {
                    // Defensive fallback — fetchOne should never throw, but just in case
                    results[globalIdx] = {
                        name: dep.name,
                        ecosystem: dep.ecosystem,
                        latestVersion: dep.version,
                        requestedVersion: dep.version,
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

                done++;
                onProgress?.(done, deps.length, dep.name);
            }),
        );
    }

    return results;
}
