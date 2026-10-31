"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ChevronsUpDownIcon,
  Loader2Icon,
  LogOutIcon,
  UserRoundIcon,
} from "lucide-react";
import { signOut } from "@/actions/auth/actions";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export function SidebarUserMenu({ username }: { username: string }) {
  const t = useTranslations("dashboard.userMenu");
  const queryClient = useQueryClient();
  const [isSigningOut, startSignOut] = useTransition();

  function handleSignOut() {
    // The query cache lives for the whole browser session; without this the next user would briefly see these rows.
    queryClient.clear();
    startSignOut(() => signOut());
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={username}>
              <Avatar>
                <AvatarFallback>
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 font-medium truncate">{username}</span>
              <ChevronsUpDownIcon className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate">
              {t("signedInAs", { username })}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserRoundIcon />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
