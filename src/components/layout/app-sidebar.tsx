"use client";

import { ReactNode } from "react";
import { BrandLogo } from "../brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SIDEBAR_LABELS } from "@/constans/sidebar-labels";
import { cn } from "cn";

// The footer is passed in so the server can render the session-dependent user menu inside this client component.
export function AppSidebar({ footer }: { footer: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard">
                <BrandLogo className="size-6 group-data-[collapsible=icon]:size-4" />
                <span className="text-xl font-bold text-primary-ink">
                  TAMAS
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_LABELS.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  tooltip={t(item.key)}
                  className={cn(
                    "py-6 px-4 text-md",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "",
                  )}
                >
                  <Link href={item.href}>
                    <item.icon />
                    {t(item.key)}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{footer}</SidebarFooter>
    </Sidebar>
  );
}
