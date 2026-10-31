"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SIDEBAR_LABELS } from "@/constans/sidebar-labels";
import { cn } from "@/lib/utils";
import { useAdvisorDrawer } from "./advisor-drawer-context";
import { QuickLogSheet } from "./quick-log-sheet";

const ITEM_CLASS =
  "flex flex-col items-center justify-center gap-1 min-h-14 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg";

function NavLink({
  item,
  isActive,
}: {
  item: (typeof SIDEBAR_LABELS)[number];
  isActive: boolean;
}) {
  const t = useTranslations("navigation");

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(ITEM_CLASS, isActive && "text-primary-ink")}
    >
      <item.icon aria-hidden className="size-5" />
      {t(item.key)}
    </Link>
  );
}

// Phones only (Phase 1 / 1.3): the sidebar stays on larger screens. Logging sits in the middle, one tap from any page.
export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const advisor = useAdvisorDrawer();
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [dashboard, transaction, profile] = SIDEBAR_LABELS;

  return (
    <>
      <nav
        aria-label={t("main")}
        // Keeps a gap under the labels even on screens without a home indicator (safe area 0).
        className="fixed inset-x-0 bottom-0 z-40 pt-1.5 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="grid grid-cols-5 px-1">
          <NavLink item={dashboard} isActive={pathname === dashboard.href} />
          <NavLink
            item={transaction}
            isActive={pathname === transaction.href}
          />
          <button
            type="button"
            onClick={() => setIsLogOpen(true)}
            aria-haspopup="dialog"
            className={cn(ITEM_CLASS, "text-primary-ink")}
          >
            <span className="flex items-center justify-center -mt-5 rounded-full shadow-sm size-12 bg-primary text-primary-foreground">
              <PlusIcon aria-hidden className="size-6" />
            </span>
            {t("log")}
          </button>
          <button
            type="button"
            onClick={() => advisor.setIsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={advisor.isOpen}
            className={cn(ITEM_CLASS, advisor.isOpen && "text-primary-ink")}
          >
            <BotIcon aria-hidden className="size-5" />
            {t("advisor")}
          </button>
          <NavLink item={profile} isActive={pathname === profile.href} />
        </div>
      </nav>
      <QuickLogSheet open={isLogOpen} onOpenChange={setIsLogOpen} />
    </>
  );
}
