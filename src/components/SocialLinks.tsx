import { siFacebook, siInstagram, siTiktok, siX } from "simple-icons";
import type { SiteContent } from "@/lib/content/schema";

// Official brand marks from Simple Icons (CC0). Profiles left blank in /admin are hidden.
const NETWORKS = [
  { key: "facebook", label: "Facebook", icon: siFacebook },
  { key: "instagram", label: "Instagram", icon: siInstagram },
  { key: "x", label: "X (Twitter)", icon: siX },
  { key: "tiktok", label: "TikTok", icon: siTiktok },
] as const;

export function SocialLinks({ socials, tone = "dark" }: { socials: SiteContent["socials"]; tone?: "dark" | "light" }) {
  const links = NETWORKS.filter((n) => socials[n.key]);
  if (!links.length) return null;
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((n) => (
        <li key={n.key}>
          <a
            href={socials[n.key]}
            aria-label={`SG Xpress on ${n.label}`}
            data-track="social_click"
            data-track-location={n.key}
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
              tone === "dark" ? "border border-white/25 text-white hover:bg-white/10" : "bg-white text-navy shadow-sm hover:bg-mist"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
              <path d={n.icon.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
