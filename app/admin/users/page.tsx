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

  const users = await getAllUsers()

  return (
    <div className="flex flex-col h-screen px-4 py-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Users className="w-7 h-7" />
          Gestión de Usuarios
        </h1>
      </div>

      <div className="flex-1 min-h-0">
        <UserManagement users={users || []} updateUserRole={updateUserRole} />
      </div>
    </div>
  )
}
