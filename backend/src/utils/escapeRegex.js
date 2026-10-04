// RegExp.escape only exists in Node 24+, and this project targets Node 22.
const SYNTAX = /[.*+?^${}()|[\]\\-]/g;

export const escapeRegex = (value) => String(value).replace(SYNTAX, "\\$&");
