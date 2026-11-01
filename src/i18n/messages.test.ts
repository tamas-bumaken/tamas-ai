import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import id from "../../messages/id.json";

// Flattens nested messages into ["dashboard.title", "Dashboard"] pairs.
function flatten(value: unknown, prefix = ""): [string, unknown][] {
  if (typeof value !== "object" || value === null) return [[prefix, value]];

  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  it("has the same keys in every language", () => {
    const keys = (messages: unknown) =>
      flatten(messages)
        .map(([path]) => path)
        .sort();

    expect(keys(id)).toEqual(keys(en));
  });

  it("takes the footer year as a value instead of a hardcoded one", () => {
    for (const messages of [en, id]) {
      expect(messages.landing.footer.copyright).toContain("{year}");
    }
  });

  it("has no empty translations", () => {
    const empty = [...flatten(en), ...flatten(id)].filter(
      ([, text]) => typeof text !== "string" || text.trim() === "",
    );

    expect(empty).toEqual([]);
  });
});
