const DEFAULT_HEADERS: Record<string, string> = {
    'User-Agent': 'depstein/0.1.0 (https://github.com/kstij/DepStein)',
    Accept: 'application/json',
};

const RETRY_COUNT = 3;
const RETRY_BASE_DELAY_MS = 500;

export async function fetchJson(url: string, options?: RequestInit): Promise<unknown> {
    const response = await fetchWithRetry(url, options, 0);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
    }
    return response.json();
}

export async function fetchHead(url: string): Promise<boolean> {
    try {
        const response = await fetchWithRetry(url, { method: 'HEAD' }, 0);
        return response.ok;
    } catch {
        return false;
    }
}

async function fetchWithRetry(url: string, options: RequestInit | undefined, attempt: number): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...DEFAULT_HEADERS,
                ...(options?.headers as Record<string, string> | undefined),
            },
        });

        if (response.status === 429) {
            if (attempt >= RETRY_COUNT) {
                throw new Error(`Rate limited after ${RETRY_COUNT} retries: ${url}`);
            }
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * RETRY_BASE_DELAY_MS;
            await sleep(delay);
            return fetchWithRetry(url, options, attempt + 1);
        }

        return response;
    } catch (err) {
        if (attempt >= RETRY_COUNT) throw err;
        await sleep(Math.pow(2, attempt) * RETRY_BASE_DELAY_MS);
        return fetchWithRetry(url, options, attempt + 1);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
