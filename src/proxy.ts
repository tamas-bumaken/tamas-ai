import { localizedNext } from "@/i18n/proxy";
import { supabaseProxy } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await supabaseProxy(request, localizedNext);
}

export const config = {
  matcher: [
    // App icons, iOS launch screens and the manifest are public and fetched by the browser on its own,
    // so they skip the session check and the locale rewrite.
    "/((?!_next/static|_next/image|favicon.ico|icon/|apple-icon|splash/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
