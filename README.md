<p align="center">
  <img src="https://img.shields.io/npm/v/depscore?color=0ea5e9&style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/l/depscore?color=22c55e&style=flat-square" alt="license" />
  <img src="https://img.shields.io/node/v/depscore?color=f59e0b&style=flat-square" alt="node version" />
  <img src="https://img.shields.io/badge/ecosystems-npm%20%C2%B7%20PyPI%20%C2%B7%20Cargo%20%C2%B7%20Go-a855f7?style=flat-square" alt="ecosystems" />
</p>

```
██████╗ ███████╗██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║  ██║█████╗  ██████╔╝███████╗██║     ██║   ██║██████╔╝█████╗
██║  ██║██╔══╝  ██╔═══╝ ╚════██║██║     ██║   ██║██╔══██╗██╔══╝
██████╔╝███████╗██║     ███████║╚██████╗╚██████╔╝██║  ██║███████╗
╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

<p align="center"><strong>Dependency health scoring for npm · PyPI · Cargo · Go — right in your terminal.</strong></p>

<br />

depscore audits every dependency in your project and scores it **0–100** across six dimensions — security, maintenance, popularity, bundle size, TypeScript support, and license. Pop it open with a single command and get an interactive TUI to triage your dependencies before they become problems.

---

## Screenshots

### Main Dashboard

```
  ██████╗ ███████╗██████╗  ...
  v0.1.0  ~/projects/my-app  [npm]
  ────────────────────────────────────────────────────────────────────────────────
  8 packages   avg 80/100  B   ██████████████████████░░░░░░░░  0 critical  1 poor

  PACKAGE              VER         SCORE    GRADE   ISSUES
  ────────────────────────────────────────────────────────────────────────────────
  › @types/react       18.2.0       89/100    A
    @types/node        20.10.0      85/100    A      huge size
    chalk              5.3.0        84/100    B      1 vuln (LOW)
    commander          11.1.0       84/100    B
    ink                4.4.1        84/100    B
    typescript         5.3.0        75/100    B      huge size
    react              18.2.0       74/100    B      vulnerable
    tsx                4.6.0        64/100    C      no types

  ────────────────────────────────────────────────────────────────────────────────
  [↑↓] navigate  [enter] details  [f] filter: All  [s] sort: Score  [e] export  [q] quit
```

### Detail Panel (`Enter` on any package)

```
  moment               2.29.4    42/100   D   [prod]
  Parse, validate, manipulate, and display dates in javascript.

  license  MIT    updated  3 years ago    downloads  12.1M/wk    bundle  329KB gzip (65KB min)
  repo     https://github.com/moment/moment

  Score Breakdown
    Maintenance   ██░░░░░░░░░░░░░░░░░░      2/20   ↓ Updated over 2 years ago
    Popularity    ████████████████████    10/10   87.3M/week
    Bundle Size   ░░░░░░░░░░░░░░░░░░░░     0/15   ↓ Huge bundle (>100KB gzip)
    TypeScript    ██████████████░░░░░░      7/10   @types/ available
    License       ████████████████████    15/15   MIT (permissive)
    Security      ███████████████░░░░░    22/30   1 vuln(s), LOW

  Suggested Actions
    ⚠  Not actively maintained — consider a fork or alternative
    ◆  Very large bundle — evaluate if this package is worth the size
    ↑  New version available: 2.29.4 → 2.30.1

  Replace with
    →  dayjs  (91/100 A)  — saves 327KB gzip   lightweight Day.js, same API
      or:  date-fns  (94/100 A)  — saves 281KB gzip   modular date utilities
```

### Interactive Path Picker (run `depscore` from any directory)

```
  ██████╗ ███████╗██████╗  ...
  Dependency health scorer  ·  npm · pypi · cargo · go
  ────────────────────────────────────────────────────────────────────────────────

  Enter the path to a project, or press Enter to scan the current directory.

  › Project path  ·  ~/projects/my-rust-app█

  [enter] scan  [esc/ctrl-c] quit
```

### CI Output (`--ci`)

```
depscore CI — 32 packages, avg 68/100 (C)
threshold: 70/100

  ✗ moment                           42/100  D  outdated, huge bundle
      → Replace with: dayjs
  ✗ left-pad                         18/100  F  abandoned
  ! node-sass                        49/100  D  vulnerable, outdated
  ~ axios                            66/100  C  no types
  ✓ express                          94/100  A  ok
  ✓ chalk                            84/100  B  ok

✗ Average score 68/100 is below threshold 70/100
```

In GitHub Actions, failing packages additionally emit `::error::` annotations visible inline in pull request diffs.

---

## Installation

```bash
# Install globally
npm install -g depscore

# Or run without installing
npx depscore

# Or with Bun
bunx depscore
```

**Requirements:** Node.js 18+

---

## Usage

```bash
# Open the interactive TUI (auto-detects ecosystem)
depscore

# Analyze a specific directory
depscore ~/projects/my-app

# Show only failing/critical dependencies
depscore --filter critical

# Sort by date last updated (oldest first = most stale)
depscore --sort updated

# Show only the 10 worst packages
depscore --top 10

# Export a full JSON report
depscore --json > report.json

# CI mode — plain text + GitHub Actions annotations
depscore --ci
depscore --ci --min-score 80

# Auto-replace deprecated packages in package.json
depscore --fix

# Force a specific ecosystem
depscore --ecosystem pypi

# Bypass disk cache for fresh API data
depscore --no-cache
```

---

## CLI Reference

| Option | Description | Default |
|--------|-------------|---------|
| `[path]` | Project directory to analyze | `.` |
| `--ecosystem` | Force: `npm` \| `pypi` \| `cargo` \| `golang` | auto |
| `--filter` | `all` \| `critical` \| `poor` \| `dev` \| `prod` | `all` |
| `--sort` | `score` \| `name` \| `size` \| `updated` | `score` |
| `--top <n>` | Show only the N worst packages | all |
| `--json` | Raw JSON output instead of TUI | — |
| `--ci` | CI mode: plain text + GitHub Actions `::error::` | — |
| `--min-score <n>` | Exit 1 if avg score < N (default 70 with `--ci`) | — |
| `--fix` | Rewrite `package.json` with modern replacements | — |
| `--no-cache` | Skip disk cache, fetch fresh data | — |
| `-v, --version` | Show version | — |

---

## Interactive Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate the dependency list |
| `Enter` | Open detail panel for the selected package |
| `Esc` | Close the detail panel |
| `f` | Cycle filters (all → critical → poor → dev → prod) |
| `s` | Cycle sort (score → name → size → updated) |
| `e` | Export report to `depscore-report-<timestamp>.json` |
| `q` | Quit |

---

## Scoring

Each dependency is scored **0–100** by summing six dimensions. The model is penalty-based — packages start clean and lose points when evidence suggests a problem.

| Dimension | Max | Measured by |
|-----------|:---:|-------------|
| Security | 30 | CVEs from [OSV.dev](https://osv.dev), version-aware |
| Maintenance | 20 | Days since last release |
| Bundle Size | 15 | Gzip size via [bundlephobia](https://bundlephobia.com) (npm only) |
| License | 15 | Legal risk classification |
| TypeScript | 10 | Built-in types, `@types/`, or none |
| Popularity | 10 | Weekly / monthly downloads |
| **Total** | **100** | |

### Security (0–30)

| Worst CVE affecting installed version | Points |
|--------------------------------------|--------|
| None | 30 |
| LOW | 22 |
| MEDIUM | 15 |
| HIGH | 3 |
| CRITICAL | 0 |

Queries are version-aware — only CVEs that affect the _installed_ version count.

### Maintenance (0–20)

| Time since last release | Points |
|------------------------|--------|
| ≤ 30 days | 20 |
| ≤ 90 days | 18 |
| ≤ 6 months | 16 |
| ≤ 1 year | 10 |
| ≤ 2 years | 2 |
| > 2 years | 0 |

### Bundle Size (0–15) — npm only

Uses real gzip sizes from bundlephobia, not tarball unpacked size.

| Gzip size | Points |
|-----------|--------|
| < 5 KB | 15 |
| < 25 KB | 12 |
| < 50 KB | 10 |
| < 100 KB | 10 (flagged: large) |
| ≥ 100 KB | 0 (flagged: huge) |

Non-npm packages receive 15/15.

### TypeScript Support (0–10)

| Support | Points |
|---------|--------|
| Built-in (`types`/`typings` in `package.json`) | 10 |
| `@types/` package available | 7 |
| No types | 0 |

### License (0–15)

| License | Points |
|---------|--------|
| MIT, Apache-2.0, BSD-*, ISC | 15 |
| Unlicense, CC0 | 12 |
| MPL-2.0, LGPL | 10 |
| GPL variants | 5 |
| Unknown / Proprietary | 0 |

### Popularity (0–10)

| Weekly downloads (npm) | Points |
|------------------------|--------|
| ≥ 1 million | 10 |
| ≥ 100K | 8 |
| ≥ 10K | 7 |
| ≥ 1K | 5 |
| ≥ 100 | 2 |
| < 100 | 0 |

### Grade Scale

| Score | Grade |
|-------|:-----:|
| 85–100 | **A** |
| 70–84 | **B** |
| 50–69 | **C** |
| 30–49 | **D** |
| 0–29 | **F** |

---

## Supported Ecosystems

| Ecosystem | Manifest | Data sources |
|-----------|----------|-------------|
| **npm** | `package.json` | npm registry · download API · bundlephobia · OSV |
| **PyPI** | `requirements.txt` · `pyproject.toml` · `setup.py` | pypi.org · pypistats.org · OSV |
| **Cargo** | `Cargo.toml` · `Cargo.lock` | crates.io · OSV |
| **Go** | `go.mod` | proxy.golang.org · GitHub API · OSV |

---

## `--fix` — Automated Replacements

`depscore --fix` rewrites `package.json` replacing 30+ known problematic packages:

| Remove | Replace with | Why |
|--------|-------------|-----|
| `moment` | `dayjs` | 329KB → ~2KB gzip, near-identical API |
| `request` | `got` | Officially deprecated since 2020 |
| `node-sass` | `sass` | Official Dart Sass port |
| `tslint` | `eslint` | Deprecated, merged into ESLint |
| `colors` | `chalk` | Supply-chain incident |
| `lodash` | `es-toolkit` | Native ESM, tree-shakeable, 97% smaller |
| `uuid` | `nanoid` | Smaller, faster, cryptographically strong |
| `faker` | `@faker-js/faker` | Community-maintained fork |
| `cross-fetch` | `native fetch` | Node 18+ has `fetch` built-in |
| `left-pad` | `String.prototype.padStart` | Abandoned; native in JS |
| … and 20+ more | | |

Run `npm install` after `--fix` to apply lockfile changes.

---

## CI / CD

### GitHub Actions

```yaml
- name: Audit dependencies
  run: npx depscore --ci --min-score 75
```

- Outputs a plain-text table of all packages with scores and issues
- Emits `::error::` annotations on failing packages when `GITHUB_ACTIONS=true`
- Exits with code 1 if the average score is below the threshold

### Plain shell

```bash
# Fail if average drops below 70
depscore --min-score 70 --json
```

---

## Caching

API responses are cached at `~/.depscore/cache.json` with a **1-hour TTL**. Repeated runs are near-instant. Cached packages are labelled `[cached]` in the detail panel. Use `--no-cache` to bypass.

---

## JSON Output

```jsonc
{
  "projectPath": "/Users/you/my-app",
  "ecosystem": "npm",
  "averageScore": 80.4,
  "grade": "B",
  "totalCount": 8,
  "criticalCount": 0,
  "poorCount": 1,
  "scoredDependencies": [
    {
      "raw": { "name": "chalk", "version": "5.3.0", "isDev": false },
      "totalScore": 84,
      "grade": "B",
      "issues": ["1 vuln (LOW)"],
      "suggestion": null,
      "dimensions": {
        "maintenance":   { "score": 18, "maxScore": 20, "reason": "Updated within 6 months" },
        "popularity":    { "score": 10, "maxScore": 10, "reason": "430.9M/week" },
        "bundleSize":    { "score": 12, "maxScore": 15, "reason": "3.1KB gzip (small)" },
        "typescript":    { "score": 10, "maxScore": 10, "reason": "Built-in types" },
        "license":       { "score": 15, "maxScore": 15, "reason": "MIT (permissive)" },
        "vulnerability": { "score": 22, "maxScore": 30, "reason": "1 vuln(s), LOW" }
      }
    }
  ]
}
```

---

## Architecture

```
src/
├── index.ts                   CLI entry (Commander) — routes to TUI / JSON / CI / fix
├── core/
│   ├── types.ts               Shared TypeScript interfaces
│   ├── cache.ts               Disk cache  (~/.depscore/cache.json, 1-hr TTL)
│   ├── scanner.ts             Detects ecosystem, parses manifests + lockfiles
│   ├── fetcher.ts             Parallel batch fetcher (10 concurrent)
│   ├── scorer.ts              Pure scoring engine (6 dimensions → 0–100)
│   ├── replacements.ts        30+ deprecated-package replacement database
│   └── vulnerabilities.ts     OSV.dev API client (version-aware CVE queries)
├── ecosystems/
│   ├── npm.ts                 npm registry · download API · bundlephobia
│   ├── pypi.ts                PyPI JSON API · pypistats.org
│   ├── cargo.ts               crates.io API
│   └── golang.ts              Go module proxy · GitHub API
├── tui/
│   ├── dashboard.tsx          Main Ink/React app component
│   ├── table.tsx              Scrollable dependency table with grade colours
│   ├── summary.tsx            Score distribution bar
│   ├── detail.tsx             Package detail panel + replacement suggestions
│   ├── picker.tsx             Interactive path picker (run from any directory)
│   └── colors.ts              Grade/score colour helpers
└── utils/
    ├── http.ts                Fetch with retry + rate-limit backoff
    ├── format.ts              Number formatting, relative dates, progress bars
    └── spinner.ts             Stderr spinner for non-TUI modes
```

---

## Development

```bash
git clone https://github.com/depscore/depscore
cd depscore
npm install

# Run in dev mode against any local project
npm run dev -- ~/projects/my-app

# Build
npm run build

# Install as a global command from local build
npm install -g .
```

---

## License

MIT
