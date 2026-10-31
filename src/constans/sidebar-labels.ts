import { BanknoteIcon, LayoutDashboardIcon, UserRoundIcon } from "lucide-react";

// `key` names the label in the "navigation" messages.
export const SIDEBAR_LABELS = [
  {
    key: "dashboard",
    icon: LayoutDashboardIcon,
    href: "/dashboard",
  },
  {
    key: "transactions",
    icon: BanknoteIcon,
    href: "/dashboard/transaction",
  },
  {
    key: "profile",
    icon: UserRoundIcon,
    href: "/dashboard/profile",
  },
] as const;
