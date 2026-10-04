// Deliberately tiny markdown subset: bold, bullet and numbered lists, paragraphs and line
// breaks. Everything is built as React elements from plain text, so bot output can never
// inject HTML. No dangerouslySetInnerHTML anywhere.
const BOLD = /(\*\*[^*\n]+\*\*)/g;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function renderInline(text, keyPrefix) {
  return text
    .split(BOLD)
    .filter((part) => part !== "")
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${keyPrefix}-b${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      )
    );
}

export function renderMarkdown(source) {
  const lines = String(source ?? "").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const key = `p${blocks.length}`;
    blocks.push(
      <p key={key} className="whitespace-pre-wrap">
        {paragraph.map((line, index) => (
          <span key={`${key}-l${index}`}>
            {index > 0 ? <br /> : null}
            {renderInline(line, `${key}-${index}`)}
          </span>
        ))}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const key = `l${blocks.length}`;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key}
        className={`ml-5 space-y-1 ${list.ordered ? "list-decimal" : "list-disc"}`}
      >
        {list.items.map((item, index) => (
          <li key={`${key}-i${index}`}>{renderInline(item, `${key}-${index}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  for (const line of lines) {
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)[1]);
      continue;
    }

    flushList();
    if (line.trim() === "") flushParagraph();
    else paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
