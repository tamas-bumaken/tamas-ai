import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToIDR(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

// A true minus sign: a hyphen reads as a dash next to "Rp" and screen readers skip it.
export function convertToSignedIDR(value: number) {
  return `${value < 0 ? "−" : ""}${convertToIDR(Math.abs(value))}`;
}

//error perbedaan data antara server dan client
// export function convertToIDR(value: number) {
//   return new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency: "IDR",
//     maximumFractionDigits: 0,
//   }).format(value);
// }
