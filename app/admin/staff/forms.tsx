"use client";

import { useActionState, useState } from "react";

import { ROLE_INFO, ROLES } from "@/lib/staff";
import { createStaff, updateStaff, type StaffState } from "./actions";

type Row = { id: string; name: string; email: string; role: string; active: boolean; pending: boolean; lastLogin: string | null };

export function StaffRow({ staff, me }: { staff: Row; me: boolean }) {
  const [state, action, pending] = useActionState(updateStaff, null);
  const [role, setRole] = useState(staff.role);

  return (
    <>
      <tr className={`border-line border-t align-top ${staff.active ? "" : "opacity-55"}`}>
        <td className="px-4 py-3">
          <span className="font-semibold">{staff.name}</span>
          {me && <span className="text-grey"> (you)</span>}
          <span className="text-grey block text-xs">{staff.email}</span>
          {!staff.active && <span className="text-sale mt-1 block text-xs font-semibold">Switched off</span>}
          {staff.active && staff.pending && <span className="mt-1 block text-xs text-[#8a6d1f]">Hasn&apos;t set their own password yet</span>}
        </td>
        <td className="px-4 py-3">
          {me ? (
            ROLE_INFO[staff.role as keyof typeof ROLE_INFO]?.name ?? staff.role
          ) : (
            <form action={action} className="flex items-center gap-2">
              <input type="hidden" name="id" value={staff.id} />
              <input type="hidden" name="intent" value="role" />
              <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className="input w-auto py-1.5 text-sm" aria-label={`Role for ${staff.name}`}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_INFO[r].name}
                  </option>
                ))}
              </select>
              {role !== staff.role && (
                <button className="text-sm font-semibold hover:underline" disabled={pending}>
                  Save
                </button>
              )}
            </form>
          )}
        </td>
        <td className="text-grey px-4 py-3 whitespace-nowrap">{staff.lastLogin ?? "Never"}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          {!me && (
            <form action={action} className="inline-flex gap-4">
              <input type="hidden" name="id" value={staff.id} />
              {staff.active && (
                <button
                  name="intent"
                  value="reset"
                  className="text-sm hover:underline"
                  disabled={pending}
                  onClick={(e) => {
                    if (!confirm(`Give ${staff.name} a new temporary password? Their current password stops working and they're logged out.`)) e.preventDefault();
                  }}
                >
                  Reset password
                </button>
              )}
              {staff.active ? (
                <button
                  name="intent"
                  value="deactivate"
                  className="text-sale text-sm hover:underline"
                  disabled={pending}
                  onClick={(e) => {
                    if (!confirm(`Switch off ${staff.name}'s account? They're logged out straight away. You can switch it back on later.`)) e.preventDefault();
                  }}
                >
                  Switch off
                </button>
              ) : (
                <button name="intent" value="activate" className="text-sm font-semibold hover:underline" disabled={pending}>
                  Switch back on
                </button>
              )}
            </form>
          )}
        </td>
      </tr>
      {state && (
        <tr>
          <td colSpan={4} className="px-4 pb-4">
            <Result state={state} />
          </td>
        </tr>
      )}
    </>
  );
}

export function NewStaffForm() {
  const [state, action, pending] = useActionState(createStaff, null);
  const [role, setRole] = useState("fulfilment");
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="staff-name" className="field-label">
              Name
            </label>
            <input id="staff-name" name="name" required maxLength={80} className="input" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="staff-email" className="field-label">
              Email (they log in with this)
            </label>
            <input id="staff-email" name="email" type="email" required className="input" autoComplete="off" />
          </div>
        </div>
        <fieldset>
          <legend className="field-label">Role</legend>
          <div className="grid gap-2 md:grid-cols-3">
            {ROLES.map((r) => (
              <label key={r} className={`flex cursor-pointer gap-3 border p-3 ${role === r ? "border-forest bg-forest/5" : "border-line"}`}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-forest mt-1" />
                <span>
                  <span className="block text-sm font-semibold">{ROLE_INFO[r].name}</span>
                  <span className="text-grey block text-xs">{ROLE_INFO[r].blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-dark" disabled={pending}>
          {pending ? "Adding…" : "Add staff member"}
        </button>
      </form>
      {state && <Result state={state} />}
    </div>
  );
}

function Result({ state }: { state: NonNullable<StaffState> }) {
  const [copied, setCopied] = useState(false);
  if (state.error)
    return (
      <p className="text-sale text-sm" role="alert">
        {state.error}
      </p>
    );
  if (state.credentials) {
    const { name, email, password } = state.credentials;
    const text = `Your login for the ${location.host} admin:\n${location.origin}/admin/login\nEmail: ${email}\nTemporary password: ${password}\nYou'll choose your own password when you first log in.`;
    return (
      <div className="border-forest/40 bg-forest/5 border p-4 text-sm" role="status">
        <p className="font-semibold">Send these details to {name}. The password is only shown once.</p>
        <pre className="mt-3 overflow-x-auto bg-white p-3 font-mono text-[13px] whitespace-pre-wrap">{text}</pre>
        <button
          type="button"
          className="btn btn-line mt-3 h-9 px-4 text-[12px]"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }
  return state.ok ? (
    <p className="text-forest text-sm" role="status">
      {state.ok}
    </p>
  ) : null;
}
