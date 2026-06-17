import Link from 'next/link'
import { signup } from '../login/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-foreground/60">
          For NUS students — share and find clarities.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-4">
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

        <label className="flex flex-col gap-1.5 text-sm">
          Username
          <input
            name="username"
            type="text"
            required
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Year of study
          <select
            name="year"
            required
            defaultValue=""
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50"
          >
            <option value="" disabled>Select year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Major / course
          <input
            name="major"
            type="text"
            required
            placeholder="e.g. Computer Science"
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50 placeholder:text-foreground/40"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Faculty
          <input
            name="faculty"
            type="text"
            required
            placeholder="e.g. School of Computing"
            className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2 text-foreground outline-none focus:border-foreground/50 placeholder:text-foreground/40"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
        >
          Create account
        </button>
      </form>

      <p className="text-sm text-foreground/60">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-foreground underline">
          Log in
        </Link>
      </p>
    </div>
  )
}