import Link from "next/link";

// Shared building blocks so every page uses the same buttons, sections and headings.

type Variant = "gold" | "navy" | "outline" | "outline-light" | "whatsapp";

const VARIANTS: Record<Variant, string> = {
  gold: "bg-gold text-navy hover:brightness-95",
  navy: "bg-navy text-white hover:bg-navy-soft",
  outline: "border-2 border-navy text-navy hover:bg-mist",
  "outline-light": "border-2 border-white/60 text-white hover:bg-white/10",
  whatsapp: "bg-whatsapp text-white hover:brightness-110",
};

export function Button({
  href,
  variant = "navy",
  size = "md",
  className = "",
  children,
  track,
  trackLocation,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  track?: string;
  trackLocation?: string;
}) {
  const sizes = { sm: "min-h-12 px-3 text-[15px] whitespace-nowrap", md: "min-h-12 px-5 text-base", lg: "min-h-14 px-6 text-lg" };
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${sizes[size]} ${VARIANTS[variant]} ${className}`;
  const data = track ? { "data-track": track, "data-track-location": trackLocation } : {};
  const external = /^(https?:|tel:|mailto:)/.test(href);
  return external ? (
    <a href={href} className={cls} {...data}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} {...data}>
      {children}
    </Link>
  );
}

export function Section({
  id,
  tone = "white",
  className = "",
  children,
}: {
  id?: string;
  tone?: "white" | "mist" | "navy" | "gold";
  className?: string;
  children: React.ReactNode;
}) {
  const bg = {
    white: "bg-white",
    mist: "bg-mist",
    navy: "bg-navy text-white",
    gold: "bg-gold text-navy",
  }[tone];
  return (
    <section id={id} className={`${bg} py-10 md:py-16 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">{children}</div>
    </section>
  );
}

export function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-2xl font-extrabold leading-tight md:text-4xl ${className}`}>{children}</h2>;
}

export function PageTitle({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-14">
        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{title}</h1>
        {intro ? <p className="mt-3 max-w-2xl text-base text-on-navy md:text-lg">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function IconTile({ children, tone = "navy" }: { children: React.ReactNode; tone?: "navy" | "gold" }) {
  return (
    <span
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${
        tone === "navy" ? "bg-navy text-gold" : "bg-gold text-navy"
      }`}
    >
      {children}
    </span>
  );
}
