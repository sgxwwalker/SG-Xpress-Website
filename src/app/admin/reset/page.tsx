import Image from "next/image";
import Link from "next/link";
import { resetTokenValid } from "@/lib/password-reset";
import { ResetForm } from "./ResetForm";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token ?? "");
  const valid = await resetTokenValid(token);
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} className="h-12 w-auto self-start" />
      <div>
        <h1 className="text-2xl font-extrabold">Choose a new password</h1>
        {valid ? <p className="text-sm text-muted">At least 10 characters. You&apos;ll use it to log in from now on.</p> : null}
      </div>
      {valid ? <ResetForm token={token} /> : <ExpiredLink />}
      <Link href="/admin/login" className="self-center text-sm font-semibold underline underline-offset-2">Back to log in</Link>
    </main>
  );
}

function ExpiredLink() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <p role="alert" className="text-sm">This reset link has expired or has already been used. Links work once and only for a short time.</p>
      <Link href="/admin/forgot" className="flex h-12 items-center justify-center rounded-xl bg-navy font-semibold text-white">Send a new link</Link>
    </div>
  );
}
