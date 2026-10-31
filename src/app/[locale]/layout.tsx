import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/providers/query-clinet";
import {
  BRAND_COLOR,
  SPLASH_SCREENS,
  splashMediaQuery,
} from "../_lib/app-icon";
import { LOCALES } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Both languages are prerendered; the proxy picks one per request from the locale cookie.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: "TAMAS",
    description: t("description"),
    // Opened from the iOS home screen, the app runs full screen under its own name.
    // The startup images replace the blank white screen iOS shows while the installed app loads.
    appleWebApp: {
      capable: true,
      title: "TAMAS",
      statusBarStyle: "default",
      startupImage: SPLASH_SCREENS.map((screen) => ({
        url: `/splash/${screen.id}`,
        media: splashMediaQuery(screen),
      })),
    },
  };
}

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
  // Lets env(safe-area-inset-bottom) report the home indicator, so the bottom navigation can clear it.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="flex flex-col min-h-full">
        <NextIntlClientProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              {/* On phones toasts sit above the dashboard's bottom navigation (and its safe area). */}
              <Toaster
                mobileOffset={{
                  bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
                }}
              />
            </TooltipProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
