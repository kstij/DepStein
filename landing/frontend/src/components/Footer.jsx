import { Github } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-black mt-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 border-2 border-black bg-neo-black flex items-center justify-center shadow-neo-sm">
                <span className="text-white font-black text-xs">DS</span>
              </div>
              <span className="text-xl font-black text-black uppercase">DEPSTEIN</span>
            </div>
            <p className="text-gray-600 font-medium max-w-xs">
              Dependency health scoring for npm &middot; PyPI &middot; Cargo &middot; Go &mdash; right in your terminal.
            </p>
            <div className="flex items-center space-x-3">
              <a href="https://github.com/kstij/DepStein" target="_blank" rel="noopener noreferrer"
                className="p-2 border-2 border-black shadow-neo-sm hover:shadow-neo transition-all bg-white hover:bg-gray-100">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.npmjs.com/package/depstein" target="_blank" rel="noopener noreferrer"
                className="px-3 py-1 border-2 border-black shadow-neo-sm hover:shadow-neo transition-all bg-neo-pink font-bold text-sm">
                npm
              </a>
            </div>
          </div>

          {/* Install */}
          <div>
            <h3 className="font-black uppercase text-sm mb-3 border-b-2 border-black pb-2">Install</h3>
            <div className="space-y-2 text-sm font-medium text-gray-700">
              <p className="font-mono bg-gray-100 px-2 py-1 border border-gray-200">npm install -g depstein</p>
              <p className="font-mono bg-gray-100 px-2 py-1 border border-gray-200">npx depstein</p>
              <p className="font-mono bg-gray-100 px-2 py-1 border border-gray-200">bunx depstein</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-black uppercase text-sm mb-3 border-b-2 border-black pb-2">Links</h3>
            <div className="space-y-2 text-sm">
              <a href="https://github.com/kstij/DepStein" target="_blank" rel="noopener noreferrer"
                className="block font-bold hover:underline">GitHub</a>
              <a href="https://www.npmjs.com/package/depstein" target="_blank" rel="noopener noreferrer"
                className="block font-bold hover:underline">npm package</a>
              <a href="https://github.com/kstij/DepStein/issues" target="_blank" rel="noopener noreferrer"
                className="block font-bold hover:underline">Report Issue</a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t-2 border-black flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-gray-600">&copy; {currentYear} depstein. MIT License.</p>
          <p className="text-sm font-bold text-gray-600">Made with &#9829; &mdash; <code className="font-mono bg-gray-100 px-1">depstein@0.1.1</code></p>
        </div>
      </div>
    </footer>
  )
}
