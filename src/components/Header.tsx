import Image from "next/image";
import Link from "next/link";
import { LOGIN_URL, NAV, REGISTER_URL } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
        <Link href="/" aria-label="SG Xpress Shipping home" className="flex-none">
          <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} priority className="h-10 w-auto md:h-12" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-lg px-3 py-2 text-[15px] font-medium hover:bg-mist">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={LOGIN_URL}
            data-track="login_click"
            data-track-location="header"
            className="flex min-h-11 items-center px-2 text-sm font-semibold md:rounded-xl md:border-2 md:border-navy md:px-4"
          >
            Log in
          </a>
          <a
            href={REGISTER_URL}
            data-track="register_click"
            data-track-location="header"
            className="hidden min-h-11 items-center rounded-xl bg-gold px-4 text-sm font-semibold text-navy hover:brightness-95 md:flex"
          >
            Register
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
