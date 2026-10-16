"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";

/** True for the page you're on (and its sub-pages, e.g. a job under Careers). */
export function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** The computer menu. The page you're on gets a gold underline. */
export function MainNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {NAV.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative block rounded-lg px-3 py-2 text-[15px] hover:bg-mist ${current ? "font-semibold" : "font-medium"}`}
              >
                {item.label}
                {current ? <span aria-hidden="true" className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-gold" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
