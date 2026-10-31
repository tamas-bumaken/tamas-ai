"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import WizardInput from "./wizard-input";

// Quick entry from any page on a phone (Phase 1 / 1.3), opened by the + in the bottom navigation.
export function QuickLogSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard.quickLog");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        {/* min-h-0 lets this area shrink inside the drawer's max height and scroll, so the drafts and their save
            button stay reachable instead of being cut off below the screen. */}
        <div className="min-h-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto">
          <WizardInput onSaved={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
