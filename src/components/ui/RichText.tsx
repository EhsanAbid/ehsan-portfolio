import type { ReactNode } from "react";
import type { RichDoc, RichNode } from "@/schema/rich";

/**
 * Renders the whitelisted rich-text JSON as React elements.
 * Text goes through React (auto-escaped) and only known node/mark types produce tags,
 * so this can never output a <script> or an onclick — no HTML sanitiser library needed.
 */
function renderNode(node: RichNode, key: number): ReactNode {
  const children = node.content?.map(renderNode);
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "hardBreak":
      return <br key={key} />;
    case "text": {
      let out: ReactNode = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") out = <strong>{out}</strong>;
        else if (mark.type === "italic") out = <em>{out}</em>;
        else if (mark.type === "link" && mark.attrs?.href) {
          const external = /^https?:/i.test(mark.attrs.href);
          out = (
            <a href={mark.attrs.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {out}
            </a>
          );
        }
      }
      return <span key={key}>{out}</span>;
    }
    default:
      return null;
  }
}

export function RichText({ doc, className = "" }: { doc: RichDoc; className?: string }) {
  return <div className={`rich ${className}`}>{doc.content.map(renderNode)}</div>;
}
