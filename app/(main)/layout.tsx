import Navbar from "@/shared/components/Navbar"
import Footer from "@/shared/components/Footer"

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
