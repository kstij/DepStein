/**
 * Curated replacement suggestions for common problematic npm packages.
 *
 * savesKbGzip: approximate bundle size reduction in KB (gzip) vs the original.
 *   null = can't be meaningfully compared (CLI-only tool, Node built-in, etc.)
 * approxScore: rough health score for the alternative (used for display only).
 * replacement: actual npm package name for --fix. null for native JS alternatives.
 */

export interface PackageAlternative {
    name: string | null;
    label: string;             // e.g. "dayjs"
    replacement: string | null;
    reason: string;
    savesKbGzip: number | null;
    approxScore: number;
}

export interface ReplacementEntry {
    alternatives: PackageAlternative[];
}

export const REPLACEMENTS: Record<string, ReplacementEntry> = {
    moment: {
        alternatives: [
            {
                name: 'dayjs',
                label: 'dayjs',
                replacement: 'dayjs',
                reason: 'same Moment-compatible API, drop-in replacement',
                savesKbGzip: 65,
                approxScore: 91,
            },
            {
                name: 'date-fns',
                label: 'date-fns',
                replacement: 'date-fns',
                reason: 'functional API, fully tree-shakeable',
                savesKbGzip: 47,
                approxScore: 94,
            },
        ],
    },

    request: {
        alternatives: [
            {
                name: 'got',
                label: 'got',
                replacement: 'got',
                reason: 'modern, promise-native, streams support',
                savesKbGzip: 18,
                approxScore: 89,
            },
            {
                name: 'node-fetch',
                label: 'node-fetch',
                replacement: 'node-fetch',
                reason: 'fetch-compatible API, lightweight',
                savesKbGzip: 22,
                approxScore: 85,
            },
        ],
    },

    axios: {
        alternatives: [
            {
                name: 'ky',
                label: 'ky',
                replacement: 'ky',
                reason: 'fetch-based, 50% smaller, similar API',
                savesKbGzip: 9,
                approxScore: 88,
            },
        ],
    },

    lodash: {
        alternatives: [
            {
                name: 'es-toolkit',
                label: 'es-toolkit',
                replacement: 'es-toolkit',
                reason: '97% smaller bundle, drop-in replacements for common utils',
                savesKbGzip: 21,
                approxScore: 93,
            },
            {
                name: 'lodash-es',
                label: 'lodash-es (tree-shaken)',
                replacement: 'lodash-es',
                reason: 'same API, fully tree-shakeable ES modules',
                savesKbGzip: 15,
                approxScore: 87,
            },
        ],
    },

    'lodash-es': {
        alternatives: [
            {
                name: 'es-toolkit',
                label: 'es-toolkit',
                replacement: 'es-toolkit',
                reason: '97% smaller bundle, modern TypeScript-first alternative',
                savesKbGzip: 18,
                approxScore: 93,
            },
        ],
    },

    underscore: {
        alternatives: [
            {
                name: 'es-toolkit',
                label: 'es-toolkit',
                replacement: 'es-toolkit',
                reason: 'actively maintained, smaller, typed',
                savesKbGzip: 12,
                approxScore: 93,
            },
        ],
    },

    uuid: {
        alternatives: [
            {
                name: 'nanoid',
                label: 'nanoid',
                replacement: 'nanoid',
                reason: '60% smaller, URL-safe by default',
                savesKbGzip: 1,
                approxScore: 95,
            },
        ],
    },

    rimraf: {
        alternatives: [
            {
                name: null,
                label: 'fs.rm({ recursive: true }) — Node built-in',
                replacement: null,
                reason: 'built into Node.js 14.14+, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    mkdirp: {
        alternatives: [
            {
                name: null,
                label: 'fs.mkdirSync({ recursive: true }) — Node built-in',
                replacement: null,
                reason: 'built into Node.js 10.12+, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    glob: {
        alternatives: [
            {
                name: 'fast-glob',
                label: 'fast-glob',
                replacement: 'fast-glob',
                reason: '2–20× faster, actively maintained, better types',
                savesKbGzip: 3,
                approxScore: 91,
            },
        ],
    },

    'node-sass': {
        alternatives: [
            {
                name: 'sass',
                label: 'sass (Dart Sass)',
                replacement: 'sass',
                reason: 'official Dart Sass; node-sass is deprecated and unmaintained',
                savesKbGzip: null,
                approxScore: 94,
            },
        ],
    },

    tslint: {
        alternatives: [
            {
                name: 'eslint',
                label: 'eslint + @typescript-eslint',
                replacement: 'eslint',
                reason: 'tslint is deprecated; ESLint is the unified JS/TS linter',
                savesKbGzip: null,
                approxScore: 95,
            },
        ],
    },

    'uglify-js': {
        alternatives: [
            {
                name: 'terser',
                label: 'terser',
                replacement: 'terser',
                reason: 'ES6+ aware, faster, actively maintained',
                savesKbGzip: null,
                approxScore: 90,
            },
        ],
    },

    'cross-fetch': {
        alternatives: [
            {
                name: null,
                label: 'native fetch (Node 18+)',
                replacement: null,
                reason: 'fetch is built into Node 18+ and all modern browsers',
                savesKbGzip: null,
                approxScore: 100,
            },
            {
                name: 'node-fetch',
                label: 'node-fetch (Node <18)',
                replacement: 'node-fetch',
                reason: 'narrower scope, lighter than cross-fetch',
                savesKbGzip: 2,
                approxScore: 85,
            },
        ],
    },

    faker: {
        alternatives: [
            {
                name: '@faker-js/faker',
                label: '@faker-js/faker',
                replacement: '@faker-js/faker',
                reason: 'official community fork with active maintenance (faker v6+ is unmaintained)',
                savesKbGzip: null,
                approxScore: 92,
            },
        ],
    },

    'node-uuid': {
        alternatives: [
            {
                name: 'uuid',
                label: 'uuid',
                replacement: 'uuid',
                reason: 'node-uuid is the old name; uuid is the maintained successor',
                savesKbGzip: 0,
                approxScore: 88,
            },
        ],
    },

    colors: {
        alternatives: [
            {
                name: 'chalk',
                label: 'chalk',
                replacement: 'chalk',
                reason: 'no prototype pollution, actively maintained',
                savesKbGzip: 1,
                approxScore: 95,
            },
        ],
    },

    superagent: {
        alternatives: [
            {
                name: 'got',
                label: 'got',
                replacement: 'got',
                reason: 'lighter, promise-native, better TypeScript support',
                savesKbGzip: 8,
                approxScore: 89,
            },
        ],
    },

    'body-parser': {
        alternatives: [
            {
                name: null,
                label: 'express.json() — Express built-in',
                replacement: null,
                reason: 'body-parser is bundled inside Express 4.16+',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    grunt: {
        alternatives: [
            {
                name: 'vite',
                label: 'vite',
                replacement: 'vite',
                reason: 'modern build tool: ESM-native, instant HMR, config-light',
                savesKbGzip: null,
                approxScore: 96,
            },
        ],
    },

    gulp: {
        alternatives: [
            {
                name: 'vite',
                label: 'vite',
                replacement: 'vite',
                reason: 'modern build tool, replaces complex Gulp pipelines',
                savesKbGzip: null,
                approxScore: 96,
            },
        ],
    },

    bower: {
        alternatives: [
            {
                name: null,
                label: 'npm + vite',
                replacement: null,
                reason: 'bower is officially deprecated; all modern front-end uses npm',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    'coffee-script': {
        alternatives: [
            {
                name: 'typescript',
                label: 'TypeScript',
                replacement: 'typescript',
                reason: 'typed superset of JS with far better tooling and ecosystem',
                savesKbGzip: null,
                approxScore: 97,
            },
        ],
    },

    'left-pad': {
        alternatives: [
            {
                name: null,
                label: "String.prototype.padStart() — native JS",
                replacement: null,
                reason: 'native JS since ES2017, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    'is-number': {
        alternatives: [
            {
                name: null,
                label: 'typeof x === "number" && !isNaN(x)',
                replacement: null,
                reason: 'one-liner, no package needed',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    'is-string': {
        alternatives: [
            {
                name: null,
                label: 'typeof x === "string"',
                replacement: null,
                reason: 'native JS type check, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    formidable: {
        alternatives: [
            {
                name: 'busboy',
                label: 'busboy',
                replacement: 'busboy',
                reason: 'lower-level, actively maintained, used by Fastify',
                savesKbGzip: 4,
                approxScore: 88,
            },
            {
                name: 'multer',
                label: 'multer',
                replacement: 'multer',
                reason: 'Express-friendly multipart middleware',
                savesKbGzip: 3,
                approxScore: 82,
            },
        ],
    },

    'query-string': {
        alternatives: [
            {
                name: null,
                label: 'URLSearchParams — native Web API',
                replacement: null,
                reason: 'built into browsers and Node 10+, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },

    'object-assign': {
        alternatives: [
            {
                name: null,
                label: 'Object.assign() or spread {...obj}',
                replacement: null,
                reason: 'native ES2015, zero dependencies',
                savesKbGzip: null,
                approxScore: 100,
            },
        ],
    },
};

/**
 * Returns the replacement info for a package, or null if none is known.
 */
export function getReplacements(name: string): PackageAlternative[] | null {
    return REPLACEMENTS[name.toLowerCase()]?.alternatives ?? null;
}

/**
 * Returns the label of the first/best replacement (for summary display).
 */
export function getSuggestedLabel(name: string): string | null {
    const alts = getReplacements(name);
    return alts?.[0]?.label ?? null;
}

/**
 * Returns the npm package name for the best replacement (for --fix).
 */
export function getBestReplacementPackage(name: string): string | null {
    const alts = getReplacements(name);
    return alts?.[0]?.replacement ?? null;
}
