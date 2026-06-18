"use client";

import { useActionState, useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  INITIAL_STATE,
  type Clarity,
  type ClarityActionState,
} from "@/app/lib/clarity-types";
import { Markdown } from "@/app/components/Markdown";

type FormAction = (
  prevState: ClarityActionState,
  formData: FormData,
) => Promise<ClarityActionState>;

type Props = {
  action: FormAction;
  initial?: Clarity;
  submitLabel: string;
};

export function ClarityForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [body, setBody] = useState(initial?.body ?? "");
  // Defer the preview render so KaTeX/highlight work doesn't run on every
  // keystroke; React keeps the textarea responsive and catches up when idle.
  const deferredBody = useDeferredValue(body);

  const errorMessage =
    state && "ok" in state && state.ok === false ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-4xl">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 max-w-2xl">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="border border-rule rounded px-3 py-2 bg-transparent focus:outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1 max-w-2xl">
        <span className="text-sm font-medium">Module code</span>
        <input
          name="module_code"
          required
          placeholder="e.g. CS2030S"
          defaultValue={initial?.module_code ?? ""}
          className="border border-rule rounded px-3 py-2 bg-transparent focus:outline-none focus:border-accent"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Body</span>
        <span className="text-xs text-muted">
          Supports Markdown, LaTeX math (<code>$…$</code> inline,{" "}
          <code>$$…$$</code> block), and fenced code blocks.
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          <textarea
            name="body"
            required
            rows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"# Heading\n\nWrite here…  $E = mc^2$"}
            className="border border-rule rounded px-3 py-2 bg-transparent focus:outline-none focus:border-accent font-mono text-sm min-h-88"
          />
          <div
            aria-live="polite"
            className="border border-rule rounded px-4 py-3 bg-white/40 overflow-auto min-h-88"
          >
            {deferredBody.trim() ? (
              <Markdown source={deferredBody} />
            ) : (
              <p className="text-sm text-muted">
                Preview appears here as you type.
              </p>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <p aria-live="polite" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={pending}
          className="border border-foreground rounded px-4 py-2 font-medium hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/" className="text-sm underline underline-offset-4">
          Cancel
        </Link>
      </div>
    </form>
  );
}
