import React from "react";

// Renders the small Markdown subset the tutor is asked to use, as React elements
// (never raw HTML), so model output can't inject markup.

const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
};

// Emoji and pictographic symbols are removed (the UI uses SVG icons); arrows and maths symbols stay.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}]/gu;

export const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.replace(EMOJI, "").replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={`b${i}`} className="overflow-x-auto rounded-xl bg-[#1F2230] p-3 font-mono text-[13px] leading-relaxed text-white">
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    const bullet = /^\s*[-*]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ""));
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={`b${i}`} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {items.map((item, j) => (
            <li key={j}>{renderInline(item, `li${i}-${j}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)/);
    if (heading) {
      blocks.push(
        <p key={`b${i}`} className="font-bold">
          {renderInline(heading[1], `h${i}`)}
        </p>
      );
      i++;
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !bullet.test(lines[i]) &&
      !numbered.test(lines[i]) &&
      !/^#{1,4}\s+/.test(lines[i])
    ) {
      para.push(lines[i++]);
    }
    blocks.push(<p key={`b${i}`}>{renderInline(para.join(" "), `p${i}`)}</p>);
  }

  return <div className="space-y-2.5">{blocks}</div>;
};
