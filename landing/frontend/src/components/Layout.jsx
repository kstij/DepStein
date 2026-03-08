import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <Navbar />
      <main className="flex-grow pt-24 px-4 max-w-7xl mx-auto w-full relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  )
}
