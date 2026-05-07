import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-8 text-foreground">Mis Datos</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-8">
        <ProfileForm initialProfile={profile || {}} />
      </div>
    </div>
  );
}
