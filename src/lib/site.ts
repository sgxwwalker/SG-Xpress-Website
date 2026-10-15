// Fixed links that aren't staff-editable.
export const REGISTER_URL = "https://cx.sgxpressja.com/signup";
export const LOGIN_URL = "https://cx.sgxpressja.com/login";
export const APP_STORE_URL = "https://apps.apple.com/us/app/sgxpress/id6448686762";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.courierdepotja.sgx";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/faqs", label: "FAQs" },
  { href: "/rates", label: "Rates" },
  { href: "/calculator", label: "Calculator" },
  { href: "/china-direct", label: "China Direct" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function whatsappUrl(number: string, message?: string): string {
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}
