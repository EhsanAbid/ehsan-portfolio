"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <label>
        <span className="a-label">Email</span>
        <input name="email" type="email" autoComplete="username" required className="a-input" />
      </label>
      <label>
        <span className="a-label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="a-input" />
      </label>
      {state?.error && (
        <p className="a-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="a-btn a-btn-primary !min-h-10" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
