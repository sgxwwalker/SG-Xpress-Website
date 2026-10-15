import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

// Official store badges. Keep them the same height, as Apple and Google's badge rules require.
export function AppLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={APP_STORE_URL} data-track="app_store_click" data-track-location="apple" className="overflow-hidden rounded-[10px] transition hover:opacity-90">
        <Image src="/images/badge-app-store.png" alt="Download on the App Store" width={810} height={238} className="h-12 w-auto md:h-14" />
      </a>
      <a href={PLAY_STORE_URL} data-track="app_store_click" data-track-location="google" className="overflow-hidden rounded-[10px] transition hover:opacity-90">
        <Image src="/images/badge-google-play.png" alt="Get it on Google Play" width={810} height={238} className="h-12 w-auto md:h-14" />
      </a>
    </div>
  );
}
