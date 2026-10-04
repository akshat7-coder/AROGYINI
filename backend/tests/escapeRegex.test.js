import { escapeRegex } from "../src/utils/escapeRegex.js";

describe("escapeRegex", () => {
  it("leaves plain text untouched", () => {
    expect(escapeRegex("maternity leave")).toBe("maternity leave");
  });

  it("escapes every regex metacharacter", () => {
    for (const char of [".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\", "-"]) {
      expect(escapeRegex(char)).toBe(`\\${char}`);
    }
  });

  it("makes a metacharacter match itself literally", () => {
    const pattern = new RegExp(escapeRegex("a.b"), "i");
    expect(pattern.test("a.b")).toBe(true);
    expect(pattern.test("axb")).toBe(false);
  });

  it("neutralises input that would otherwise be an invalid regex", () => {
    expect(() => new RegExp(escapeRegex("c++ ("), "i")).not.toThrow();
    expect(new RegExp(escapeRegex("c++ ("), "i").test("C++ (")).toBe(true);
  });

  it("stops a user search from acting as a wildcard", () => {
    const pattern = new RegExp(escapeRegex(".*"), "i");
    expect(pattern.test("anything")).toBe(false);
    expect(pattern.test("literal .* here")).toBe(true);
  });

  it("keeps working inside a word-boundary pattern, as intentService builds it", () => {
    const pattern = new RegExp(`\\b${escapeRegex("sos")}\\b`, "i");
    expect(pattern.test("press SOS now")).toBe(true);
    expect(pattern.test("sost")).toBe(false);
  });

  it("coerces non-strings instead of throwing", () => {
    expect(escapeRegex(12)).toBe("12");
    expect(escapeRegex(null)).toBe("null");
  });
});
