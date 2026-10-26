import { loadAdmin } from "@/lib/adminData";
import { recentLoginAttempts } from "@/lib/auth";
import { AccountForms } from "./AccountForms";

export default async function AccountPage() {
  const { admin } = await loadAdmin();
  const attempts = await recentLoginAttempts(25);
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {admin.email}</p>
      </div>
      <AccountForms />
      <section className="a-card p-4" aria-labelledby="att-h">
        <h2 id="att-h" className="mb-3 text-lg font-semibold text-white">Recent login attempts</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1.5">When</th>
              <th>Result</th>
              <th>IP (hashed)</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="py-1.5">{a.createdAt.toLocaleString("en-GB")}</td>
                <td className={a.success ? "text-emerald-300" : "text-rose-300"}>{a.success ? "success" : "failed"}</td>
                <td className="font-mono text-xs text-muted">{a.ipHash.slice(0, 10)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
