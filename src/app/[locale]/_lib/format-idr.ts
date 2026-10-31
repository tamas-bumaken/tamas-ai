import { convertToIDR } from "@/lib/utils";

// A no-break space keeps "Rp" on the same line as its amount inside running text.
export function formatIDR(value: number) {
  return convertToIDR(value).replace(" ", " ");
}
