import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ForgotForm } from "./ForgotForm";

export default async function ForgotPasswordPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} className="h-12 w-auto self-start" />
      <div>
        <h1 className="text-2xl font-extrabold">Forgot your password?</h1>
        <p className="text-sm text-muted">Enter your username or email. We&apos;ll email you a link to choose a new password.</p>
      </div>
      <ForgotForm />
      <Link href="/admin/login" className="self-center text-sm font-semibold underline underline-offset-2">Back to log in</Link>
    </main>
  );
}
