import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { RawDependency, Ecosystem, ScanResult } from './types.js';

// ── npm / Node.js ──────────────────────────────────────────────────────────────

function parseNpm(projectPath: string): RawDependency[] {
    const pkgPath = join(projectPath, 'package.json');
    if (!existsSync(pkgPath)) return [];

    let pkg: Record<string, unknown>;
    try {
        pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
    } catch {
        return [];
    }

    const deps: RawDependency[] = [];

    const addDeps = (map: Record<string, string> | undefined, isDev: boolean) => {
        if (!map) return;
        for (const [name, version] of Object.entries(map)) {
            if (typeof version !== 'string') continue;
            deps.push({
                name,
                // Strip semver range operators: ^1.2.3 → 1.2.3
                version: version.replace(/^[^0-9]*/, '') || version,
                ecosystem: 'npm',
                isDev,
            });
        }
    };

    addDeps(pkg.dependencies as Record<string, string>, false);
    addDeps(pkg.devDependencies as Record<string, string>, true);
    addDeps(pkg.peerDependencies as Record<string, string>, false);

    return deps;
}

// ── Python ─────────────────────────────────────────────────────────────────────

function parsePythonRequirements(path: string): RawDependency[] {
    const deps: RawDependency[] = [];
    const lines = readFileSync(path, 'utf-8').split('\n');
    for (const raw of lines) {
        const line = raw.split('#')[0].trim();
        if (!line || line.startsWith('-')) continue;
        // Handle: package==1.0, package>=1.0, package[extra]==1.0, package
        const m = line.match(/^([A-Za-z0-9_.-]+)(?:\[.*?\])?(?:[=<>!~,\s]+([^\s;]+))?/);
        if (m) {
            deps.push({
                name: m[1].toLowerCase().replace(/_/g, '-'),
                version: m[2] ? m[2].replace(/^[^0-9]*/, '') || m[2] : 'latest',
                ecosystem: 'pypi',
                isDev: false,
            });
        }
    }
    return deps;
}

function parsePyprojectToml(content: string): RawDependency[] {
    const deps: RawDependency[] = [];

    // [tool.poetry.dependencies]
    const poetryMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\n\[)/);
    if (poetryMatch) {
        for (const line of poetryMatch[1].split('\n')) {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/);
            if (m && m[1].toLowerCase() !== 'python') {
                deps.push({
                    name: m[1].toLowerCase(),
                    version: m[2].replace(/^[^0-9]*/, '') || m[2],
                    ecosystem: 'pypi',
                    isDev: false,
                });
            }
        }
    }

    // [tool.poetry.dev-dependencies]
    const poetryDevMatch = content.match(/\[tool\.poetry\.dev-dependencies\]([\s\S]*?)(?=\n\[)/);
    if (poetryDevMatch) {
        for (const line of poetryDevMatch[1].split('\n')) {
            const m = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/);
            if (m) {
                deps.push({
                    name: m[1].toLowerCase(),
                    version: m[2].replace(/^[^0-9]*/, '') || m[2],
                    ecosystem: 'pypi',
                    isDev: true,
                });
            }
        }
    }

    // [project.dependencies] (PEP 621)
    const pep621Match = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (pep621Match) {
        const items = pep621Match[1].match(/["']([^"']+)["']/g) ?? [];
        for (const item of items) {
            const pkg = item.replace(/["']/g, '');
            const m = pkg.match(/^([A-Za-z0-9_.-]+)/);
            if (m) {
                deps.push({
                    name: m[1].toLowerCase().replace(/_/g, '-'),
                    version: 'latest',
                    ecosystem: 'pypi',
                    isDev: false,
                });
            }
        }
    }

    return deps;
}

function parsePython(projectPath: string): RawDependency[] {
    const deps: RawDependency[] = [];

    const reqPath = join(projectPath, 'requirements.txt');
    if (existsSync(reqPath)) {
        deps.push(...parsePythonRequirements(reqPath));
    }

    const pyprojectPath = join(projectPath, 'pyproject.toml');
    if (existsSync(pyprojectPath)) {
        try {
            const content = readFileSync(pyprojectPath, 'utf-8');
            deps.push(...parsePyprojectToml(content));
        } catch { /* ignore */ }
    }

    const setupPyPath = join(projectPath, 'setup.py');
    if (existsSync(setupPyPath)) {
        try {
            const content = readFileSync(setupPyPath, 'utf-8');
            const m = content.match(/install_requires\s*=\s*\[([\s\S]*?)\]/);
            if (m) {
                const items = m[1].match(/["']([^"']+)["']/g) ?? [];
                for (const item of items) {
                    const pkg = item.replace(/["']/g, '');
                    const nm = pkg.match(/^([A-Za-z0-9_.-]+)/);
                    if (nm) {
                        deps.push({
                            name: nm[1].toLowerCase().replace(/_/g, '-'),
                            version: 'latest',
                            ecosystem: 'pypi',
                            isDev: false,
                        });
                    }
                }
            }
        } catch { /* ignore */ }
    }

    return deps;
}

// ── Go ─────────────────────────────────────────────────────────────────────────

function parseGo(projectPath: string): RawDependency[] {
    const goModPath = join(projectPath, 'go.mod');
    if (!existsSync(goModPath)) return [];

    const deps: RawDependency[] = [];
    const content = readFileSync(goModPath, 'utf-8');

    // require ( ... ) blocks
    const blockMatches = [...content.matchAll(/require\s*\(([\s\S]*?)\)/g)];
    for (const block of blockMatches) {
        for (const line of block[1].split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue;
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                deps.push({
                    name: parts[0],
                    version: parts[1],
                    ecosystem: 'golang',
                    isDev: trimmed.includes('// indirect'),
                });
            }
        }
    }

    // Single-line: require module v1.2.3
    const singleMatches = [...content.matchAll(/^require\s+(\S+)\s+(v[\d.]+[\w.-]*)/gm)];
    for (const m of singleMatches) {
        deps.push({
            name: m[1],
            version: m[2],
            ecosystem: 'golang',
            isDev: false,
        });
    }

    return deps;
}

// ── Rust / Cargo ───────────────────────────────────────────────────────────────

function parseCargo(projectPath: string): RawDependency[] {
    const cargoPath = join(projectPath, 'Cargo.toml');
    if (!existsSync(cargoPath)) return [];

    const deps: RawDependency[] = [];
    const content = readFileSync(cargoPath, 'utf-8');

    // Split into sections
    const sectionRegex = /^\[([^\]]+)\]/gm;
    const sections: Array<{ header: string; start: number; end: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = sectionRegex.exec(content)) !== null) {
        if (sections.length > 0) {
            sections[sections.length - 1].end = m.index;
        }
        sections.push({ header: m[1].trim(), start: m.index + m[0].length, end: content.length });
    }

    for (const section of sections) {
        const isDepsSection = section.header === 'dependencies';
        const isDevDepsSection = section.header === 'dev-dependencies';
        if (!isDepsSection && !isDevDepsSection) continue;

        const body = content.slice(section.start, section.end);
        for (const line of body.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // name = "version"
            const simple = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/);
            if (simple) {
                deps.push({ name: simple[1], version: simple[2], ecosystem: 'cargo', isDev: isDevDepsSection });
                continue;
            }

            // name = { version = "version", ... }
            const complex = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/);
            if (complex) {
                deps.push({ name: complex[1], version: complex[2], ecosystem: 'cargo', isDev: isDevDepsSection });
            }
        }
    }

    return deps;
}

// ── Ecosystem detection ────────────────────────────────────────────────────────

function detectEcosystem(projectPath: string): Ecosystem | null {
    if (existsSync(join(projectPath, 'package.json'))) return 'npm';
    if (existsSync(join(projectPath, 'requirements.txt')) || existsSync(join(projectPath, 'pyproject.toml'))) return 'pypi';
    if (existsSync(join(projectPath, 'go.mod'))) return 'golang';
    if (existsSync(join(projectPath, 'Cargo.toml'))) return 'cargo';
    return null;
}

/**
 * Find nested package.json files for monorepo support.
 * Returns paths relative to the project root where separate package.json exist.
 */
export function findWorkspaceRoots(projectPath: string): string[] {
    const roots: string[] = [];
    const resolved = resolve(projectPath);

    try {
        const pkg = JSON.parse(readFileSync(join(resolved, 'package.json'), 'utf-8')) as {
            workspaces?: string[] | { packages?: string[] };
        };

        const patterns: string[] = Array.isArray(pkg.workspaces)
            ? pkg.workspaces
            : (pkg.workspaces?.packages ?? []);

        for (const pattern of patterns) {
            // Simple glob: packages/* or apps/*
            const base = pattern.replace(/\/\*$/, '');
            const absBase = join(resolved, base);
            if (existsSync(absBase) && statSync(absBase).isDirectory()) {
                for (const dir of readdirSync(absBase)) {
                    const full = join(absBase, dir);
                    if (statSync(full).isDirectory() && existsSync(join(full, 'package.json'))) {
                        roots.push(full);
                    }
                }
            }
        }
    } catch { /* no workspaces */ }

    return roots;
}

// ── Main export ────────────────────────────────────────────────────────────────

export function scan(projectPath: string, forceEcosystem?: Ecosystem): ScanResult | null {
    const resolvedPath = resolve(projectPath);
    const ecosystem = forceEcosystem ?? detectEcosystem(resolvedPath);

    if (!ecosystem) return null;

    let dependencies: RawDependency[];

    switch (ecosystem) {
        case 'npm': dependencies = parseNpm(resolvedPath); break;
        case 'pypi': dependencies = parsePython(resolvedPath); break;
        case 'golang': dependencies = parseGo(resolvedPath); break;
        case 'cargo': dependencies = parseCargo(resolvedPath); break;
    }

    // Deduplicate by name (keep first occurrence)
    const seen = new Set<string>();
    dependencies = dependencies.filter(dep => {
        if (seen.has(dep.name)) return false;
        seen.add(dep.name);
        return true;
    });

    return { projectPath: resolvedPath, ecosystem, dependencies };
}
