import Link from "next/link";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-col items-center justify-center flex-1 min-h-screen px-4 py-10 gap-6">
      {/* Top right, like the landing header; the safe area keeps it below the iPhone status bar in the installed app. */}
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitcher compact />
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 text-primary-ink rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <BrandLogo className="size-9" />
        <span className="text-2xl font-bold">TAMAS</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
