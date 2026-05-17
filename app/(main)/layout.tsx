import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow px-0">
        {children}
      </main>
      <Footer />
    </div>
  )
}
