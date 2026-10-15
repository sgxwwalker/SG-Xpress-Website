"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile spam check, rendered explicitly so it works after in-app
// navigation and gets a fresh one-time token after every submit.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; "response-field-name"?: string }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile failed to load")));
    s.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** `resetKey` changes after each submit (pass the form's action state) to fetch a new token. */
export function Turnstile({ resetKey }: { resetKey: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((t) => {
        if (!cancelled && box.current && !widget.current) widget.current = t.render(box.current, { sitekey: SITE_KEY });
      })
      .catch(() => {}); // the server then asks the visitor to try again
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" />;
}
