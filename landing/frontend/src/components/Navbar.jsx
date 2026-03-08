import { Link } from 'react-router-dom'
import { Menu, X, Terminal, Copy, Check, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Enable transitions only after mount to avoid flash on initial load
    const t = setTimeout(() => document.documentElement.classList.add('theme-ready'), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g depstein')
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const navLinks = [
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#features', label: 'Features' },
    { href: '#ecosystems', label: 'Ecosystems' },
    { href: 'https://github.com/kstij/DepStein', label: 'GitHub', external: true },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neo-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-neo-black flex items-center justify-center border-2 border-black shadow-neo-sm group-hover:shadow-neo transition-all">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-black tracking-tighter uppercase">DEPSTEIN</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) =>
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-2 text-sm font-bold border-2 border-black bg-white hover:bg-gray-100 hover:shadow-neo-sm transition-all">
                  {link.label}
                </a>
              ) : (
                <a key={link.href} href={link.href}
                  className="px-6 py-2 text-sm font-bold border-2 border-black bg-white hover:bg-gray-100 hover:shadow-neo-sm transition-all">
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Install CTA */}
          <button onClick={handleCopy}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-neo-green border-2 border-black shadow-neo-sm hover:shadow-neo transition-all font-mono font-bold text-sm">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : '$ npm i -g depstein'}</span>
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 border-2 border-black bg-white shadow-neo-sm hover:shadow-neo hover:bg-gray-100 active:scale-90 transition-all"
            aria-label="Toggle dark mode"
          >
            <span key={String(isDark)} className="theme-icon-spin">
              {isDark
                ? <Sun className="w-5 h-5 text-neo-yellow" />
                : <Moon className="w-5 h-5" />}
            </span>
          </button>

          {/* Mobile toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 border-2 border-black bg-white shadow-neo-sm">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="block px-4 py-3 font-bold border-2 border-black hover:bg-gray-100">
                  {link.label}
                </a>
              ) : (
                <a key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 font-bold border-2 border-black hover:bg-gray-100">
                  {link.label}
                </a>
              )
            )}
            <button onClick={handleCopy} className="w-full px-4 py-3 bg-neo-green border-2 border-black font-bold font-mono text-sm text-left">
              {copied ? '✓ Copied!' : '$ npm install -g depstein'}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
