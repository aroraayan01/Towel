import { redirect } from "next/navigation";

import { Logo } from "@/components/layout/Logo";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg">
      <Logo />
      <h1 className="mt-6 text-2xl">Shop admin</h1>
      <LoginForm />
    </div>
  );
}
