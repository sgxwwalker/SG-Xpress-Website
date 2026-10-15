"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LOGIN_URL, NAV, REGISTER_URL } from "@/lib/site";
import { IconClose, IconMenu } from "./Icons";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape, and stop the page scrolling behind the open menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line"
      >
        {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
      </button>

      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-white px-4 pb-8 pt-2 md:top-20">
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex min-h-14 items-center text-lg font-semibold aria-[current=page]:text-gold-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 grid gap-3">
            <a href={REGISTER_URL} data-track="register_click" data-track-location="menu" className="flex min-h-14 items-center justify-center rounded-xl bg-gold text-lg font-semibold text-navy">
              Sign up free
            </a>
            <a href={LOGIN_URL} data-track="login_click" data-track-location="menu" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-navy text-lg font-semibold">
              Customer login
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
