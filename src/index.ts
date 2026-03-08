#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { scan, findWorkspaceRoots } from './core/scanner.js';
import { fetchAll } from './core/fetcher.js';
import { score as scoreOne, getGrade, getReplacementPackage } from './core/scorer.js';
import { Dashboard } from './tui/dashboard.js';
import { PickerApp } from './tui/picker.js';
import { Spinner } from './utils/spinner.js';
import type { CLIOptions, Ecosystem, ScoredDependency, AuditResult } from './core/types.js';

// ── Version ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
    try {
        const pkgPath = join(__dirname, '..', 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
        return pkg.version;
    } catch {
        return '0.1.0';
    }
}

// ── Build AuditResult ──────────────────────────────────────────────────────────

function buildResult(
    projectPath: string,
    ecosystem: Ecosystem,
    scored: ScoredDependency[],
): AuditResult {
    const avg = scored.length > 0
        ? scored.reduce((s, d) => s + d.totalScore, 0) / scored.length
        : 0;

    return {
        projectPath,
        ecosystem,
        scoredDependencies: scored,
        averageScore: avg,
        grade: getGrade(Math.round(avg)),
        totalCount: scored.length,
        criticalCount: scored.filter(d => d.grade === 'F').length,
        poorCount: scored.filter(d => d.grade === 'D').length,
        fairCount: scored.filter(d => d.grade === 'C').length,
        goodCount: scored.filter(d => d.grade === 'B').length,
        excellentCount: scored.filter(d => d.grade === 'A').length,
        timestamp: new Date().toISOString(),
    };
}

// ── JSON mode ─────────────────────────────────────────────────────────────────

async function runJsonMode(scanResult: NonNullable<ReturnType<typeof scan>>, options: CLIOptions) {
    const spinner = new Spinner();
    const { dependencies } = scanResult;

    spinner.start(`Fetching metadata for ${dependencies.length} packages…`);
    let lastDone = 0;

    const metadata = await fetchAll(dependencies, options.noCache, (done, total, current) => {
        if (done !== lastDone) {
            spinner.update(`[${done}/${total}] ${current}`);
            lastDone = done;
        }
    });

    spinner.succeed(`Fetched ${metadata.length} packages`);

    const scored = metadata.map((meta, i) => scoreOne(dependencies[i], meta));
    const result = buildResult(scanResult.projectPath, scanResult.ecosystem, scored);

    process.stdout.write(JSON.stringify(result, null, 2) + '\n');

    // CI threshold check
    if (options.minScore != null && result.averageScore < options.minScore) {
        process.stderr.write(
            `\n✗ Average score ${Math.round(result.averageScore)}/100 is below ` +
            `the required threshold of ${options.minScore}/100\n`,
        );
        process.exit(1);
    }
}

// ── CI mode ─────────────────────────────────────────────────────────────────
//
// Plain-text output + GitHub Actions ::error:: annotations for poor packages.
// Exits with code 1 if average score is below the threshold (default 70).

async function runCiMode(scanResult: NonNullable<ReturnType<typeof scan>>, options: CLIOptions) {
    const spinner = new Spinner();
    const { dependencies } = scanResult;

    spinner.start(`Fetching metadata for ${dependencies.length} packages…`);
    let lastDone = 0;

    const metadata = await fetchAll(dependencies, options.noCache, (done, total, current) => {
        if (done !== lastDone) {
            spinner.update(`[${done}/${total}] ${current}`);
            lastDone = done;
        }
    });

    spinner.succeed(`Fetched ${metadata.length} packages`);

    const scored = metadata.map((meta, i) => scoreOne(dependencies[i], meta));
    const result = buildResult(scanResult.projectPath, scanResult.ecosystem, scored);

    const threshold = options.minScore ?? 70;
    const isGHA = process.env['GITHUB_ACTIONS'] === 'true';

    // Table header
    process.stdout.write(`\ndepstein CI — ${result.totalCount} packages, avg ${Math.round(result.averageScore)}/100 (${result.grade})\n`);
    process.stdout.write(`threshold: ${threshold}/100\n\n`);

    // Per-package lines
    const sorted = [...scored].sort((a, b) => a.totalScore - b.totalScore);
    for (const dep of sorted) {
        const icon = dep.grade === 'F' ? '✗' : dep.grade === 'D' ? '!' : dep.grade === 'C' ? '~' : '✓';
        const issueStr = dep.issues.length > 0 ? dep.issues.join(', ') : 'ok';
        process.stdout.write(`  ${icon} ${dep.raw.name.padEnd(30)} ${String(dep.totalScore).padStart(3)}/100  ${dep.grade}  ${issueStr}\n`);
        if (dep.suggestion) {
            process.stdout.write(`      → ${dep.suggestion}\n`);
        }

        // GitHub Actions annotation for F/D packages
        if (isGHA && (dep.grade === 'F' || dep.grade === 'D')) {
            const msg = `${dep.raw.name} scored ${dep.totalScore}/100 (${dep.grade}) — ${issueStr}`;
            process.stdout.write(`::error title=${dep.raw.name}::${msg}\n`);
        }
    }

    process.stdout.write('\n');

    const failed = result.averageScore < threshold;
    if (failed) {
        const msg = `Average score ${Math.round(result.averageScore)}/100 is below threshold ${threshold}/100`;
        process.stderr.write(`✗ ${msg}\n`);
        if (isGHA) {
            process.stdout.write(`::error title=depstein::${msg}\n`);
        }
        process.exit(1);
    } else {
        process.stdout.write(`✓ Average score ${Math.round(result.averageScore)}/100 meets threshold ${threshold}/100\n`);
    }
}

// ── --fix mode ────────────────────────────────────────────────────────────────
//
// Reads package.json, replaces known deprecated packages with their recommended
// alternatives, writes the modified file, and prints what changed.
// The user must run `npm install` afterward to apply the changes.

async function runFixMode(scanResult: NonNullable<ReturnType<typeof scan>>, options: CLIOptions) {
    const spinner = new Spinner();
    const { dependencies } = scanResult;

    if (scanResult.ecosystem !== 'npm') {
        process.stderr.write('--fix currently only supports npm projects (package.json)\n');
        process.exit(1);
    }

    const pkgJsonPath = join(scanResult.projectPath, 'package.json');
    let pkgJson: Record<string, unknown>;
    try {
        pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as Record<string, unknown>;
    } catch {
        process.stderr.write(`Cannot read ${pkgJsonPath}\n`);
        process.exit(1);
    }

    spinner.start(`Fetching metadata for ${dependencies.length} packages…`);
    let lastDone = 0;

    const metadata = await fetchAll(dependencies, options.noCache, (done, total, current) => {
        if (done !== lastDone) {
            spinner.update(`[${done}/${total}] ${current}`);
            lastDone = done;
        }
    });

    spinner.succeed(`Fetched ${metadata.length} packages`);

    const scored = metadata.map((meta, i) => scoreOne(dependencies[i], meta));

    // Collect packages with a real npm package replacement
    const replacements: Array<{ from: string; to: string; reason: string }> = [];
    for (const dep of scored) {
        const replacement = getReplacementPackage(dep.raw.name);
        if (replacement) {
            replacements.push({ from: dep.raw.name, to: replacement, reason: dep.suggestion ?? '' });
        }
    }

    if (replacements.length === 0) {
        process.stdout.write('✓ No replacements found — all packages look fine!\n');
        return;
    }

    const deps = (pkgJson.dependencies ?? {}) as Record<string, string>;
    const devDeps = (pkgJson.devDependencies ?? {}) as Record<string, string>;
    const applied: typeof replacements = [];

    for (const { from, to, reason } of replacements) {
        if (from in deps) {
            delete deps[from];
            deps[to] = '*';
            applied.push({ from, to, reason });
        } else if (from in devDeps) {
            delete devDeps[from];
            devDeps[to] = '*';
            applied.push({ from, to, reason });
        }
    }

    if (applied.length === 0) {
        process.stdout.write('✓ No matching packages found in package.json to replace.\n');
        return;
    }

    if (Object.keys(deps).length > 0) pkgJson.dependencies = deps;
    if (Object.keys(devDeps).length > 0) pkgJson.devDependencies = devDeps;

    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');

    process.stdout.write('\n✓ package.json updated:\n\n');
    for (const { from, to, reason } of applied) {
        process.stdout.write(`  ${from}  →  ${to}\n`);
        if (reason) process.stdout.write(`     ${reason}\n`);
    }
    process.stdout.write('\nRun npm install to apply changes.\n\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
    const program = new Command();

    program
        .name('depstein')
        .description('Dependency health scorer for npm, PyPI, Cargo, and Go projects')
        .version(readVersion(), '-v, --version')
        .argument('[path]', 'Path to project directory', '.')
        .option('--ecosystem <type>', 'Force ecosystem: npm | pypi | cargo | golang')
        .option('--filter <mode>', 'Filter: all | critical | poor | dev | prod', 'all')
        .option('--sort <by>', 'Sort by: score | name | size | updated', 'score')
        .option('--no-cache', 'Bypass disk cache')
        .option('--json', 'Output raw JSON instead of TUI')
        .option('--top <n>', 'Show only the N worst packages')
        .option('--fix', 'Replace deprecated packages in package.json with better alternatives')
        .option('--min-score <n>', 'Exit with code 1 if average score drops below N (CI mode)')
        .option('--ci', 'CI mode: plain text + GitHub Actions ::error:: annotations (default threshold 70)')
        .addHelpText('after', `
Examples:
  $ depstein                        Analyze current directory
  $ depstein ~/my-project           Analyze specific project
  $ depstein --filter critical      Show only failing deps
  $ depstein --json > report.json   Export full report
  $ depstein --top 10               Show 10 worst packages
  $ depstein --no-cache             Bypass cache for fresh data
  $ depstein --fix                  Replace deprecated packages in package.json
  $ depstein --min-score 75         Fail CI if avg score < 75
  $ depstein --json --min-score 75  Combined: JSON output + CI threshold
  $ depstein --ci                   CI mode with GitHub Actions annotations
  $ depstein --ci --min-score 80    CI mode with custom threshold
`);

    program.parse(process.argv);

    const projectArg = program.args[0] ?? '.';
    const opts = program.opts<{
        ecosystem?: string;
        filter: string;
        sort: string;
        noCache?: boolean;
        cache?: boolean;
        json?: boolean;
        top?: string;
        fix?: boolean;
        minScore?: string;
        ci?: boolean;
    }>();

    // commander uses --no-cache → opts.cache = false
    const noCache = opts.cache === false || opts.noCache === true;

    const options: CLIOptions = {
        path: resolve(projectArg),
        ecosystem: opts.ecosystem as Ecosystem | undefined,
        filter: (opts.filter as CLIOptions['filter']) ?? 'all',
        sort: (opts.sort as CLIOptions['sort']) ?? 'score',
        noCache,
        json: opts.json ?? false,
        top: opts.top ? parseInt(opts.top, 10) : undefined,
        fix: opts.fix ?? false,
        minScore: opts.minScore ? parseInt(opts.minScore, 10) : undefined,
        ci: opts.ci ?? false,
    };

    // Validate flags
    const validFilters = ['all', 'critical', 'poor', 'dev', 'prod'];
    if (!validFilters.includes(options.filter)) {
        process.stderr.write(`Invalid --filter value "${options.filter}". Use: ${validFilters.join(' | ')}\n`);
        process.exit(1);
    }

    const validSorts = ['score', 'name', 'size', 'updated'];
    if (!validSorts.includes(options.sort)) {
        process.stderr.write(`Invalid --sort value "${options.sort}". Use: ${validSorts.join(' | ')}\n`);
        process.exit(1);
    }

    // Scan project
    const scanResult = scan(options.path, options.ecosystem);

    if (!scanResult) {
        // No project at the given path — open the interactive path-picker TUI
        // instead of dumping a plain-text error.  --json / --ci / --fix still
        // need a real project, so keep the error path for those modes.
        if (options.json || options.ci || options.fix) {
            const workspaceRoots = findWorkspaceRoots(options.path);
            if (workspaceRoots.length > 0) {
                process.stderr.write(
                    `Monorepo detected with ${workspaceRoots.length} workspace packages.\n` +
                    `Run depstein with a specific workspace path:\n` +
                    workspaceRoots.slice(0, 5).map(r => `  depstein ${r}`).join('\n') + '\n',
                );
            } else {
                process.stderr.write(
                    `No recognized project found in: ${options.path}\n` +
                    `Expected: package.json, requirements.txt, pyproject.toml, go.mod, or Cargo.toml\n`,
                );
            }
            process.exit(1);
        }

        // Interactive TUI picker
        const { waitUntilExit } = render(
            React.createElement(PickerApp, { initialPath: options.path, options }),
            { exitOnCtrlC: true },
        );
        await waitUntilExit();
        return;
    }

    if (scanResult.dependencies.length === 0) {
        process.stderr.write(`No dependencies found in ${options.path}\n`);
        process.exit(0);
    }

    if (options.ci) {
        await runCiMode(scanResult, options);
        return;
    }

    if (options.fix) {
        await runFixMode(scanResult, options);
        return;
    }

    if (options.json) {
        await runJsonMode(scanResult, options);
        return;
    }

    // TUI mode
    const { waitUntilExit } = render(
        React.createElement(Dashboard, { scanResult, options }),
        { exitOnCtrlC: true },
    );

    await waitUntilExit();
}

main().catch(err => {
    process.stderr.write(`\nFatal error: ${(err as Error).message}\n`);
    process.exit(1);
});
