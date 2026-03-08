import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, GitPullRequest, Package, Code, Zap, BarChart2, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

function CopyCommand({ cmd }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(cmd)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center space-x-3 px-6 py-3 bg-neo-black text-white border-2 border-black shadow-neo font-mono text-sm hover:shadow-neo-lg transition-all group w-full">
      <span className="text-neo-green">$</span>
      <span>{cmd}</span>
      <span className="ml-auto pl-4 text-gray-400 group-hover:text-white">
        {copied ? <Check className="w-4 h-4 text-neo-green" /> : <Copy className="w-4 h-4" />}
      </span>
    </button>
  )
}

export default function HomePage() {
  const stats = [
    { value: '4', label: 'Ecosystems', color: 'bg-neo-yellow' },
    { value: '6', label: 'Score Dimensions', color: 'bg-neo-pink' },
    { value: '100', label: 'Point Scale', color: 'bg-neo-green' },
    { value: 'CI', label: 'Native Support', color: 'bg-neo-blue' },
  ]

  const dimensions = [
    { name: 'Security', pts: 30, color: 'bg-neo-pink', icon: Shield, desc: 'CVEs from OSV.dev, version-aware vulnerability matching' },
    { name: 'Maintenance', pts: 20, color: 'bg-neo-yellow', icon: GitPullRequest, desc: 'Days since last release — flags stale and abandoned packages' },
    { name: 'Bundle Size', pts: 15, color: 'bg-neo-green', icon: Package, desc: 'Real gzip sizes via bundlephobia, not tarball unpacked size' },
    { name: 'License', pts: 15, color: 'bg-neo-orange', icon: Code, desc: 'Legal risk classification from MIT to proprietary' },
    { name: 'TypeScript', pts: 10, color: 'bg-neo-purple', icon: Zap, desc: 'Built-in types, @types/ package, or no types at all' },
    { name: 'Popularity', pts: 10, color: 'bg-neo-blue', icon: BarChart2, desc: 'Weekly download counts across npm, PyPI, Cargo, and Go' },
  ]

  const ecosystems = [
    { name: 'npm', manifest: 'package.json', color: 'bg-neo-pink', icon: '📦', sources: 'npm registry · bundlephobia · OSV' },
    { name: 'PyPI', manifest: 'requirements.txt · pyproject.toml', color: 'bg-neo-yellow', icon: '🐍', sources: 'pypi.org · pypistats.org · OSV' },
    { name: 'Cargo', manifest: 'Cargo.toml · Cargo.lock', color: 'bg-neo-green', icon: '⚙️', sources: 'crates.io · OSV' },
    { name: 'Go', manifest: 'go.mod', color: 'bg-neo-blue', icon: '🐹', sources: 'proxy.golang.org · GitHub API · OSV' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">

      {/* HERO */}
      <section className="text-center space-y-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-black"
        >
          <span className="block mb-2 md:mb-6">
            AUDIT YOUR <span className="bg-neo-yellow px-2 border-2 border-black shadow-neo-sm">DEPS</span>
          </span>
          <span className="block">
            SCORE <span className="bg-neo-green px-2 border-2 border-black shadow-neo-sm">THEM ALL</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl font-bold text-black max-w-3xl mx-auto border-2 border-black bg-white p-6 shadow-neo"
        >
          depstein audits every dependency in your project and scores it <strong>0–100</strong> across
          six dimensions — security, maintenance, bundle size, license, TypeScript support, and popularity.
          Works with npm, PyPI, Cargo, and Go.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
        >
          <div className="w-full sm:flex-1">
            <CopyCommand cmd="npm install -g depstein" />
          </div>
          <a
            href="https://github.com/kstij/DepStein"
            target="_blank"
            rel="noopener noreferrer"
            className="neo-button bg-white hover:bg-gray-100 whitespace-nowrap"
          >
            View on GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16"
        >
          {stats.map((stat, i) => (
            <div key={i} className={`neo-card p-6 text-center hover:-translate-y-1 hover:shadow-neo-lg transition-all ${stat.color}`}>
              <p className="text-4xl font-black text-black">{stat.value}</p>
              <p className="text-sm font-bold uppercase tracking-wider mt-1 text-black">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* TERMINAL DEMO */}
      <section>
        <div className="bg-neo-blue p-4 border-2 border-black shadow-neo">
          <h2 className="text-3xl font-black text-white uppercase tracking-wider">See It In Action</h2>
        </div>
        <div className="border-2 border-t-0 border-black bg-neo-black text-white p-6 font-mono text-sm shadow-neo overflow-x-auto">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-gray-400 text-xs">depstein ~/projects/my-app</span>
          </div>
          <pre className="leading-relaxed text-xs md:text-sm whitespace-pre">{`  v0.1.1  ~/projects/my-app  [npm]
  ──────────────────────────────────────────────────────────
  8 packages   avg 80/100  B   ████████████████████░░░░░░░░  0 critical  1 poor

  PACKAGE              VER         SCORE    GRADE   ISSUES
  ──────────────────────────────────────────────────────────
  › @types/react       18.2.0       89/100    A
    @types/node        20.10.0      85/100    A      huge size
    chalk              5.3.0        84/100    B      1 vuln (LOW)
    commander          11.1.0       84/100    B
    ink                4.4.1        84/100    B
    typescript         5.3.0        75/100    B      huge size
    react              18.2.0       74/100    B      vulnerable
    tsx                4.6.0        64/100    C      no types
  ──────────────────────────────────────────────────────────
  [↑↓] navigate  [enter] details  [f] filter  [s] sort  [e] export  [q] quit`}</pre>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t-4 border-black pt-12">
        <h2 className="text-4xl font-black text-black text-center mb-12 uppercase">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: '1. Install', desc: 'One command to install depstein globally. Works anywhere Node.js 18+ is available.', icon: '📦', color: 'bg-neo-yellow', cmd: 'npm install -g depstein' },
            { title: '2. Run', desc: 'Type depstein in any project directory. It auto-detects npm, PyPI, Cargo, or Go and starts scoring.', icon: '▶️', color: 'bg-neo-pink', cmd: 'depstein' },
            { title: '3. Review', desc: 'Browse the interactive TUI, dive into package details, export a JSON report, or pipe into CI.', icon: '📊', color: 'bg-neo-green', cmd: 'depstein --ci --min-score 75' },
          ].map((step, i) => (
            <div key={i} className="neo-card p-8 space-y-4 hover:-translate-y-2 transition-transform">
              <div className={`w-20 h-20 flex items-center justify-center text-4xl border-2 border-black shadow-neo-sm ${step.color}`}>
                {step.icon}
              </div>
              <h3 className="text-2xl font-black text-black uppercase">{step.title}</h3>
              <p className="text-gray-800 font-medium">{step.desc}</p>
              <code className="block bg-neo-black text-neo-green px-3 py-2 text-xs font-mono border border-gray-700">$ {step.cmd}</code>
            </div>
          ))}
        </div>
      </section>

      {/* SCORING DIMENSIONS */}
      <section id="features">
        <div className="flex items-center justify-between mb-8 bg-neo-pink p-4 border-2 border-black shadow-neo">
          <h2 className="text-3xl font-black text-black uppercase tracking-wider">Scoring Dimensions</h2>
          <span className="px-4 py-2 bg-white border-2 border-black shadow-neo-sm font-black">100 pts total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dimensions.map((dim, i) => (
            <div key={i} className="neo-card p-6 hover:-translate-y-1 hover:shadow-neo-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 border-2 border-black shadow-neo-sm ${dim.color}`}>
                  <dim.icon className="w-6 h-6 text-black" />
                </div>
                <span className="text-3xl font-black text-black">{dim.pts}<span className="text-base text-gray-500">pts</span></span>
              </div>
              <h3 className="text-xl font-black uppercase mb-2">{dim.name}</h3>
              <p className="text-gray-700 font-medium text-sm">{dim.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ECOSYSTEMS */}
      <section id="ecosystems">
        <div className="mb-8 bg-neo-green p-4 border-2 border-black shadow-neo">
          <h2 className="text-3xl font-black text-black uppercase tracking-wider">Supported Ecosystems</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecosystems.map((eco, i) => (
            <div key={i} className="neo-card p-6 flex items-start space-x-4 hover:-translate-y-1 transition-all">
              <div className={`p-4 text-3xl border-2 border-black shadow-neo-sm flex-shrink-0 ${eco.color}`}>{eco.icon}</div>
              <div>
                <h3 className="text-2xl font-black uppercase">{eco.name}</h3>
                <p className="text-gray-600 font-mono text-sm mt-1">{eco.manifest}</p>
                <p className="text-gray-500 text-sm mt-2">{eco.sources}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CI/CD */}
      <section className="border-t-4 border-black pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase">CI/CD Native</h2>
            <p className="text-lg font-medium text-gray-700">
              Drop depstein into GitHub Actions. It emits <code className="bg-gray-100 px-1 font-mono border border-gray-300">::error::</code> annotations
              directly on failing packages in pull request diffs. Exits 1 when avg score falls below your threshold.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-neo-yellow border-2 border-black font-bold text-sm">GitHub Actions</span>
              <span className="px-3 py-1 bg-neo-green border-2 border-black font-bold text-sm">Exit codes</span>
              <span className="px-3 py-1 bg-neo-pink border-2 border-black font-bold text-sm">Inline annotations</span>
            </div>
          </div>
          <div className="bg-neo-black text-white p-6 border-2 border-black shadow-neo font-mono text-sm">
            <p className="text-gray-400 mb-3"># .github/workflows/audit.yml</p>
            <pre className="text-neo-green leading-relaxed">{`- name: Audit dependencies
  run: npx depstein --ci --min-score 75`}</pre>
            <div className="mt-4 pt-4 border-t border-gray-700 text-xs leading-relaxed">
              <p className="text-white font-bold mb-2">depstein CI — 14 packages, avg 82/100 (B)</p>
              <p className="text-neo-green">✓ chalk            84/100 B  ok</p>
              <p className="text-neo-green">✓ commander        84/100 B  ok</p>
              <p className="text-neo-pink">✗ moment           42/100 D  outdated, huge bundle</p>
              <p className="text-neo-pink">    → Replace with: dayjs</p>
            </div>
          </div>
        </div>
      </section>

      {/* AUTO-FIX */}
      <section className="border-t-4 border-black pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="bg-neo-yellow border-2 border-black shadow-neo p-8 space-y-4">
            <h2 className="text-4xl font-black uppercase">Auto-Fix</h2>
            <p className="text-lg font-medium">
              Run <code className="bg-white px-2 py-1 border border-black font-mono">depstein --fix</code> to
              automatically rewrite <code className="bg-white px-2 py-1 border border-black font-mono">package.json</code> replacing
              30+ deprecated packages with modern alternatives.
            </p>
            <div className="space-y-2 text-sm font-mono bg-white border-2 border-black p-4">
              <p><span className="text-red-600">- moment</span>  →  <span className="text-green-600">+ dayjs</span>  <span className="text-gray-500">(329KB → 2KB)</span></p>
              <p><span className="text-red-600">- request</span>  →  <span className="text-green-600">+ got</span>  <span className="text-gray-500">(deprecated)</span></p>
              <p><span className="text-red-600">- lodash</span>  →  <span className="text-green-600">+ es-toolkit</span>  <span className="text-gray-500">(97% smaller)</span></p>
              <p><span className="text-red-600">- node-sass</span>  →  <span className="text-green-600">+ sass</span>  <span className="text-gray-500">(official port)</span></p>
              <p className="text-gray-400">…and 26 more</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase">More Flags</h3>
            {[
              { flag: '--json', desc: 'Raw JSON output — pipe into jq or store as artifact' },
              { flag: '--filter critical', desc: 'Show only packages with score below 30' },
              { flag: '--sort updated', desc: 'Sort by staleness — surface the most outdated first' },
              { flag: '--no-cache', desc: 'Bypass 1-hour disk cache for fresh API data' },
              { flag: '--top 10', desc: 'Show only the 10 worst-scoring packages' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-4 border-b border-gray-200 pb-3">
                <code className="text-neo-blue font-mono font-bold text-sm whitespace-nowrap bg-gray-100 px-2 py-1 border border-gray-300 flex-shrink-0">{item.flag}</code>
                <p className="text-gray-700 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="text-center py-16 border-t-4 border-black space-y-8">
        <h2 className="text-5xl font-black uppercase">Ready to Score?</h2>
        <p className="text-xl font-bold text-gray-700 max-w-xl mx-auto">
          Install depstein in one command and know the health of every dependency in seconds.
        </p>
        <div className="max-w-sm mx-auto">
          <CopyCommand cmd="npm install -g depstein" />
        </div>
        <a
          href="https://github.com/kstij/DepStein"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block neo-button bg-neo-yellow"
        >
          ★ Star on GitHub
        </a>
      </section>

    </div>
  )
}
