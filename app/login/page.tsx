import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Sign in to ClarityNUS</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <div className="flex gap-2">
          <button
            formAction={login}
            className="flex-1 rounded-md bg-black px-4 py-2 text-white"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="flex-1 rounded-md border border-black px-4 py-2"
          >
            Sign up
          </button>
        </div>
      </form>
    </main>
  )
}