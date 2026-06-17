import { createClient } from '../lib/auth-server'
import { signOut } from '../login/actions'

export default async function AuthStatus() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <a href="/login" className="text-sm underline">
        Log in
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{user.email}</span>
      <form action={signOut}>
        <button type="submit" className="underline">
          Log out
        </button>
      </form>
    </div>
  )
}