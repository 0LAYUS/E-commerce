import { getAllUsers, updateUserRole } from "@/lib/actions/authActions"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import UserManagement from "@/components/admin/UserManagement"

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "administrador") {
    redirect("/")
  }

  // Fetch initial users (first 50)
  const initialData = await getAllUsers({ limit: 50, offset: 0 })

  return (
    <div className="max-w-6xl mx-auto pb-20 mt-4 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Users className="w-8 h-8" />
          Gestión de Usuarios
        </h1>
      </div>

      <UserManagement
        initialUsers={initialData.users || []}
        totalUsers={initialData.total || 0}
        updateUserRole={updateUserRole}
      />
    </div>
  )
}