import type { Metadata } from "next";
import { READ_ONLY } from "@/lib/data-files";

export const metadata: Metadata = {
  title: "Website admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      {READ_ONLY ? (
        <p role="status" className="bg-gold px-4 py-2 text-center text-sm font-semibold text-navy">
          Preview copy: you can look around, but saving is switched off here.
        </p>
      ) : null}
      {children}
    </div>
  );
}
