"use client";

import { useActionState } from "react";

import { MIN_PASSWORD } from "@/lib/password-rules";
import { changePassword, updateName, type AccountState } from "./actions";

function Message({ state }: { state: AccountState }) {
  if (state?.error)
    return (
      <p className="text-sale text-sm" role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className="text-forest text-sm" role="status">
        {state.ok}
      </p>
    );
  return null;
}

export function PasswordForm({ first = false }: { first?: boolean }) {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="current" className="field-label">
          {first ? "Temporary password" : "Current password"}
        </label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" autoFocus={first} />
      </div>
      <div>
        <label htmlFor="next" className="field-label">
          New password
        </label>
        <input id="next" name="next" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="input" />
        <p className="text-grey mt-1 text-xs">At least {MIN_PASSWORD} characters. A few random words works well.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">
          New password again
        </label>
        <input id="confirm" name="confirm" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="input" />
      </div>
      <Message state={state} />
      <button className="btn btn-dark" disabled={pending}>
        {pending ? "Saving…" : first ? "Set password and continue" : "Change password"}
      </button>
    </form>
  );
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateName, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="name" className="field-label">
          Shown in the activity log
        </label>
        <input id="name" name="name" defaultValue={name} required maxLength={80} className="input" />
      </div>
      <button className="btn btn-line h-[46px] px-5" disabled={pending}>
        Save
      </button>
      <div className="w-full">
        <Message state={state} />
      </div>
    </form>
  );
}
