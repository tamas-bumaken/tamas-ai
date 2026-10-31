import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { localizedNext } from "./proxy";

function rewriteTarget(path: string, cookie?: string) {
  const request = new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie: `NEXT_LOCALE=${cookie}` } : {},
  });

  const target = localizedNext(request).headers.get("x-middleware-rewrite");

  return target && new URL(target).pathname;
}

describe("localizedNext", () => {
  it("serves Bahasa Indonesia to a visitor who has not chosen a language", () => {
    expect(rewriteTarget("/dashboard")).toBe("/id/dashboard");
    expect(rewriteTarget("/")).toBe("/id");
  });

  it("keeps a visitor's saved English choice", () => {
    expect(rewriteTarget("/dashboard", "en")).toBe("/en/dashboard");
  });

  it("falls back to Bahasa Indonesia for an unknown cookie value", () => {
    expect(rewriteTarget("/dashboard", "fr")).toBe("/id/dashboard");
  });

  it("leaves route handlers unprefixed", () => {
    expect(rewriteTarget("/api/chat")).toBeNull();
  });
});
