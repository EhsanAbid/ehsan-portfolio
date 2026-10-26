import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="a-card w-full max-w-sm p-6">
        <p className="eyebrow mb-2">ehsan.exe</p>
        <h1 className="mb-6 text-2xl font-bold text-white">Mission Control</h1>
        <LoginForm />
      </div>
    </main>
  );
}
