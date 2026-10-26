"use client";

import { useState, useTransition } from "react";
import { changePasswordAction, signOutEverywhereAction } from "../../actions";

export function AccountForms() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="a-card grid gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const next = String(f.get("next"));
          if (next !== f.get("confirm")) return setMsg({ ok: false, text: "The new passwords don't match." });
          const form = e.currentTarget;
          start(async () => {
            const r = await changePasswordAction(String(f.get("current")), next);
            setMsg(r.ok ? { ok: true, text: "Password changed. Other devices were signed out." } : { ok: false, text: r.error });
            if (r.ok) form.reset();
          });
        }}
      >
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <label>
          <span className="a-label">Current password</span>
          <input name="current" type="password" autoComplete="current-password" required className="a-input" />
        </label>
        <label>
          <span className="a-label">New password (12+ characters)</span>
          <input name="next" type="password" autoComplete="new-password" minLength={12} required className="a-input" />
        </label>
        <label>
          <span className="a-label">Repeat new password</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={12} required className="a-input" />
        </label>
        <button className="a-btn a-btn-primary" disabled={pending}>
          Change password
        </button>
        {msg && (
          <p role="status" className={msg.ok ? "text-xs text-emerald-300" : "a-error"}>
            {msg.text}
          </p>
        )}
      </form>
      <form action={signOutEverywhereAction} className="a-card grid content-start gap-3 p-4">
        <h2 className="text-lg font-semibold text-white">Sign out of all devices</h2>
        <p className="text-sm text-muted">Invalidates every session (including this one). Use it if you logged in on a shared computer.</p>
        <button className="a-btn a-btn-danger">Sign out everywhere</button>
      </form>
    </div>
  );
}
