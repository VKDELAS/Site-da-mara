import { getSupabaseBrowserClient } from "./client"

export async function isAdmin(userId: string): Promise<boolean> {
  // For now, check if user email is in admin list
  // You can extend this to use a database table for admin users
  const supabase = getSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) return false

  // Add your admin emails here or check against a database table
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || []
  return adminEmails.includes(user.email || "")
}

export async function requireAdmin() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const isAdminUser = await isAdmin(user.id)
  if (!isAdminUser) {
    throw new Error("Not authorized")
  }

  return user
}
