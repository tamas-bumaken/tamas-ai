import Image from "next/image";
import { cn } from "cn";

// Decorative: every place that shows it also shows the name TAMAS next to it.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/logo-1.png"
      alt=""
      width={88}
      height={88}
      className={cn("object-contain shrink-0", className)}
    />
  );
}
