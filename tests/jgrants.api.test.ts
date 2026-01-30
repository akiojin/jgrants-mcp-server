import { describe, expect, it } from "vitest";
import { buildSubsidiesQuery } from "../src/jgrants/api.js";

describe("buildSubsidiesQuery", () => {
  it("applies defaults", () => {
    const query = buildSubsidiesQuery({});
    expect(query.get("keyword")).toBe("事業");
    expect(query.get("sort")).toBe("created_date");
    expect(query.get("order")).toBe("DESC");
    expect(query.get("acceptance")).toBe("1");
  });

  it("normalizes short keyword", () => {
    const query = buildSubsidiesQuery({ keyword: "a" });
    expect(query.get("keyword")).toBe("事業");
  });

  it("keeps valid keyword", () => {
    const query = buildSubsidiesQuery({ keyword: "IT" });
    expect(query.get("keyword")).toBe("IT");
  });
});
