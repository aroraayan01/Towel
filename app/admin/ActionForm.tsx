"use client";

import { useActionState, useState } from "react";

type Result = { error?: string; ok?: string; credentials?: { email: string; password: string } } | null;

/**
 * A small form around a server action that returns { error | ok | credentials }.
 * Shows the result under the button. Temporary passwords are shown once, with a copy button.
 */
export function ActionForm({
  action,
  hidden = {},
  children,
  submit,
  confirmText,
  danger = false,
  className = "space-y-3",
}: {
  action: (state: Result, form: FormData) => Promise<Result>;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
  submit: string;
  confirmText?: string;
  danger?: boolean;
  className?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  const [copied, setCopied] = useState(false);
  const loginText = state?.credentials
    ? `Seller portal: ${location.origin}/seller/login\nEmail: ${state.credentials.email}\nTemporary password: ${state.credentials.password}\nYou'll choose your own password when you first log in.`
    : "";

  return (
    <div>
      <form
        action={run}
        className={className}
        onSubmit={(e) => {
          if (confirmText && !confirm(confirmText)) e.preventDefault();
        }}
      >
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        {children}
        <button className={danger ? "btn btn-line border-sale text-sale hover:!bg-sale hover:!text-white" : "btn btn-dark"} disabled={pending}>
          {pending ? "Working…" : submit}
        </button>
      </form>
      {state?.error && (
        <p className="text-sale mt-3 text-sm" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-forest mt-3 text-sm" role="status">
          {state.ok}
        </p>
      )}
      {state?.credentials && (
        <div className="border-forest/40 bg-forest/5 mt-3 border p-4 text-sm">
          <p className="font-semibold">Login details (shown once). They&apos;ve also been emailed if email is set up.</p>
          <pre className="mt-2 overflow-x-auto bg-white p-3 font-mono text-[13px] whitespace-pre-wrap">{loginText}</pre>
          <button
            type="button"
            className="btn btn-line mt-2 h-9 px-4 text-[12px]"
            onClick={async () => {
              await navigator.clipboard.writeText(loginText);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
