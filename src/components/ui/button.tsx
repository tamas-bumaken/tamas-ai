import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 motion-reduce:[&_svg]:transition-none [&_svg:not([class*='size-'])]:size-4 hover:[&_svg[data-icon=inline-end]]:translate-x-0.5 hover:[&_svg[data-icon=inline-start]]:-translate-x-0.5",
  {
    variants: {
      variant: {
        // Kilau cahaya menyapu dari kiri ke kanan dan cincin halo melebar saat hover.
        default:
          "bg-primary text-primary-foreground bg-[linear-gradient(110deg,transparent_40%,rgb(255_255_255/0.3)_50%,transparent_60%)] bg-[length:250%_100%] bg-[position:100%_0] bg-no-repeat duration-500 hover:bg-primary-hover hover:bg-[position:0%_0] hover:ring-4 hover:ring-primary/20 motion-reduce:bg-none",
        outline:
          "border-border bg-background shadow-xs hover:border-primary/50 hover:bg-primary/5 hover:text-primary-ink hover:ring-4 hover:ring-primary/10 aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:border-primary/60 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] hover:ring-4 hover:ring-foreground/5 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-primary/10 hover:text-primary-ink aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-primary/15",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:ring-4 hover:ring-destructive/15 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        // Garis bawah tumbuh dari kiri ke kanan saat hover.
        link: "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat text-primary hover:bg-[length:100%_1px] motion-reduce:bg-[length:100%_1px]",
      },
      size: {
        default:
          "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        // Tombol ikon: ikon membesar sedikit saat hover.
        icon: "size-9 hover:[&_svg]:scale-110",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md hover:[&_svg]:scale-110 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md hover:[&_svg]:scale-110",
        "icon-lg": "size-10 hover:[&_svg]:scale-110",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
