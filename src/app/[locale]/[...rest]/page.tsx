import { notFound } from "next/navigation";

// Every unknown URL is rewritten under app/[locale], so this sends it to the localized not-found page.
export default function CatchAllPage() {
  notFound();
}
