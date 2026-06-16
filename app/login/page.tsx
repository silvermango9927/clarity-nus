import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to ClarityNUS</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Log in, or create an account to post clarities.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50"
          />
        </label>

        <div className="mt-1 flex gap-3">
          <button
            formAction={login}
            className="flex-1 rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="flex-1 rounded-md border border-foreground/30 px-4 py-2 font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}