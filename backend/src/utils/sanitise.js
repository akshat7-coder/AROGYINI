const HTML_TAG = /<[^>]*>/g;
// Built from escapes rather than a literal class so no raw control bytes sit in the source.
const CONTROL_CHARS = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");

// Strip tags, drop control characters, collapse whitespace. Chat content is echoed back to the
// browser and forwarded to third-party bots, so it is cleaned at the boundary.
export function sanitiseText(input) {
  return String(input ?? "")
    .replace(HTML_TAG, " ")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}
