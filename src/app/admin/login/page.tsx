import Image from "next/image";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await currentUser()) redirect("/admin");
  const { reset } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} className="h-12 w-auto self-start" />
      <div>
        <h1 className="text-2xl font-extrabold">Website admin</h1>
        <p className="text-sm text-muted">Update rates, notices, branches and FAQs.</p>
      </div>
      {reset === "1" ? (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Your password has been changed. Log in with your new password.
        </p>
      ) : null}
      <LoginForm />
    </main>
  );
}
