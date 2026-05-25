"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  INITIAL_CLARITY_ACTION_STATE,
  type Clarity,
  type ClarityActionState,
} from "@/app/lib/clarity-types";

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
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_CLARITY_ACTION_STATE,
  );

  const errorMessage =
    state && "ok" in state && state.ok === false ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Module code</span>
        <input
          name="module_code"
          required
          placeholder="e.g. CS2030S"
          defaultValue={initial?.module_code ?? ""}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Body</span>
        <textarea
          name="body"
          required
          rows={10}
          defaultValue={initial?.body ?? ""}
          className="border rounded px-3 py-2 font-mono text-sm"
        />
      </label>

      {errorMessage && (
        <p aria-live="polite" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={pending}
          className="border rounded px-4 py-2 font-medium disabled:opacity-50"
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
