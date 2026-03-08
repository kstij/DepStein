import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { CacheStore, CachedMetadata, PackageMetadata } from './types.js';

const CACHE_DIR = join(homedir(), '.depscore');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class DiskCache {
    private store: CacheStore = {};
    private dirty = false;

    constructor() {
        this.load();
    }

    private load(): void {
        try {
            if (existsSync(CACHE_FILE)) {
                const raw = readFileSync(CACHE_FILE, 'utf-8');
                this.store = JSON.parse(raw) as CacheStore;
            }
        } catch {
            this.store = {};
        }
    }

    private save(): void {
        try {
            mkdirSync(CACHE_DIR, { recursive: true });
            writeFileSync(CACHE_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
            this.dirty = false;
        } catch {
            // Silently fail — cache writes are best-effort
        }
    }

    get(ecosystem: string, name: string): Omit<PackageMetadata, 'fromCache'> | null {
        const key = `${ecosystem}:${name}`;
        const entry = this.store[key];
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            delete this.store[key];
            this.dirty = true;
            return null;
        }

        const cached = entry.data as CachedMetadata;
        return {
            ...cached,
            publishedAt: cached.publishedAt ? new Date(cached.publishedAt) : null,
        };
    }

    set(ecosystem: string, name: string, data: Omit<PackageMetadata, 'fromCache'>): void {
        const key = `${ecosystem}:${name}`;
        this.store[key] = {
            data: {
                ...data,
                // Serialize Date to ISO string for JSON storage
                publishedAt: data.publishedAt ? data.publishedAt.toISOString() : null,
            } as CachedMetadata,
            timestamp: Date.now(),
        };
        this.save();
    }

    clear(): void {
        this.store = {};
        this.save();
    }

    /** Flush dirty writes at process exit */
    flush(): void {
        if (this.dirty) this.save();
    }
}

export const cache = new DiskCache();

// Ensure final flush on clean exit
process.on('exit', () => cache.flush());
