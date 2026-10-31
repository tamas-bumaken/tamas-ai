import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, Suspense } from "react";
import { useTranslations } from "next-intl";
import { AdvisorDrawerProvider } from "./_components/advisor-drawer-context";
import ChatbotDrawer from "./_components/chatbot-drawer";
import { MobileBottomNav } from "./_components/mobile-bottom-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("common");

  return (
    <SidebarProvider>
      <AppSidebar
        footer={
          // Reads the session, so it streams in without holding back the rest of the layout.
          <Suspense
            fallback={
              <Skeleton
                aria-label={t("loadingAccount")}
                className="h-12 motion-reduce:animate-none"
              />
            }
          >
            <SidebarUser />
          </Suspense>
        }
      />
      <AdvisorDrawerProvider>
        {/* On phones the bottom padding keeps the last card clear of the bottom navigation. */}
        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-4">
          {/* Phones navigate with the bottom navigation, so the sidebar toggle would only duplicate it. */}
          <SidebarTrigger className="max-md:hidden" />
          {children}
          <ChatbotDrawer />
        </main>
        <MobileBottomNav />
      </AdvisorDrawerProvider>
    </SidebarProvider>
  );
}
