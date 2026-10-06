"use client";

/** A one-button form that asks before submitting (cancel, refund, delete…). */
export function ConfirmForm({
  action,
  fields,
  label,
  message,
  className = "",
  buttonClassName = "text-sale w-full text-sm hover:underline",
}: {
  action: (form: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  message: string;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button className={buttonClassName}>{label}</button>
    </form>
  );
}
