import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "a", "b", "br", "div", "em", "h1", "h2", "h3", "h4", "i", "img", "li",
  "ol", "p", "span", "strong", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
];

export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "style", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}
