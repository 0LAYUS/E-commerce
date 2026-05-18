import { POSSidebar } from "@/components/pos/POSSidebar"

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] bg-secondary rounded-lg overflow-hidden border">
      <POSSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
