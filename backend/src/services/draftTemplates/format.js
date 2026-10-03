const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

export const romanise = (n) => NUMERALS[n - 1] ?? String(n);

export const indent = (text, prefix = "   ") =>
  String(text)
    .split("\n")
    .map((line) => `${prefix}${line.trim()}`)
    .join("\n");

export const numbered = (items, prefix = "   ") => items.map((item, i) => `${prefix}${romanise(i + 1)}. ${item}`);

export const compact = (lines) => lines.filter((line) => line !== null && line !== undefined).join("\n");
