import { marked, Tokens } from "marked";

interface MarkdownProps {
  markdown: string;
}

const HeadingToTextSizeMapping = {
  1: "text-xl",
  2: "text-lg",
  3: "text-md",
  4: "text-sm",
  5: "text-sm",
  6: "text-sm",
};

function convertMarkdownLinksToAnchors(text: string): string {
  // Matches markdown links in the format [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return text.replace(markdownLinkRegex, (match, linkText, url) => {
    return `<a href="${url}" class="underline hover:text-blue-600" target="_blank">${linkText}</a>`;
  });
}

function findListItems(src: string): {
  indent: number;
  marker: string;
  text: string;
  isListItem: boolean;
  src: string;
}[] {
  // Match: whitespace + (number. OR - OR *) + space + content
  const listItemRegex = /^((\s|\n)+)?(\-|\*(?!\*)|\d+\.)(\s+)?(.+)/;
  const items: {
    indent: number;
    marker: string;
    text: string;
    isListItem: boolean;
    src: string;
  }[] = [];

  const lines = src.split("\n");

  for (const line of lines) {
    const match = line.match(listItemRegex);

    if (match) {
      items.push({
        indent: match[1]?.length ?? 0,
        marker: match[2],
        text: match[5]?.trim() ?? "",
        isListItem: true,
        src: line,
      });
    } else {
      items.push({
        indent: 0,
        marker: "",
        text: line,
        isListItem: false,
        src: line,
      });
    }
  }

  return items;
}

function markdownListToHtml(src: string): string {
  const items = findListItems(src);
  if (items.length === 0) return src;

  // Recursively builds nested HTML lists based on indentation
  const buildList = (
    currentIndent: number,
    startIndex: number,
  ): [string, number] => {
    let html = "";
    let i = startIndex;
    let inList = false;
    let currentListTag = "";

    const closeCurrentList = () => {
      if (inList) {
        html += `</${currentListTag}>`;
        inList = false;
      }
    };

    const startNewList = (marker: string) => {
      const isOrdered = /[0-9]+\./.test(marker);
      currentListTag = isOrdered ? "ol" : "ul";
      const listClass = isOrdered ? "list-decimal" : "list-disc";
      html += `<${currentListTag} class="${listClass} list-inside">`;
      inList = true;
    };

    const processListItem = (item: (typeof items)[0]) => {
      if (!inList) {
        startNewList(item.marker);
      }

      html += `<li>${convertMarkdownLinksToAnchors(item.text)}`;

      // Handle nested list if next item is more indented
      if (i + 1 < items.length && items[i + 1].indent > currentIndent) {
        const [subList, newIndex] = buildList(items[i + 1].indent, i + 1);
        html += subList;
        i = newIndex;
      }

      html += "</li>";
    };

    while (i < items.length) {
      const item = items[i];

      // Exit if we encounter lower indentation level
      if (item.indent < currentIndent) break;

      if (item.isListItem) {
        // Handle nested list at higher indentation
        if (item.indent > currentIndent) {
          const [subList, newIndex] = buildList(item.indent, i);
          html += subList;
          i = newIndex;
        } else {
          processListItem(item);
        }
      } else {
        closeCurrentList();
        html += item.src;
      }

      i++;
    }

    closeCurrentList();
    return [html, i - 1];
  };

  const [html] = buildList(items[0].indent, 0);
  return html;
}

export function Markdown({ markdown }: MarkdownProps) {
  const renderer = new marked.Renderer();

  renderer.heading = (value) => {
    return `<h${value.depth} class="${HeadingToTextSizeMapping[value.depth as keyof typeof HeadingToTextSizeMapping]} font-bold mb-2">${value.text}</h${value.depth}>`;
  };

  renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" class="text-gray-500 underline hover:text-blue-600">${text}</a>`;
  };

  renderer.list = (value) => {
    if (value.ordered) {
      return `<ol class="list-decimal list-inside mb-4">${value.items.map((t) => `<li>${convertMarkdownLinksToAnchors(markdownListToHtml(t.text))}</li>`).join("\n")}</ol>`;
    }

    return `<ul class="list-disc list-inside mb-4">${value.items
      .map((t) => {
        return `<li>${convertMarkdownLinksToAnchors(markdownListToHtml(t.text))}</li>`;
      })
      .join("\n")}</ul>`;
  };

  renderer.paragraph = (value) => {
    const text = renderer.parser.parseInline(value.tokens);
    return `<p class="[&:not(:last-child)]:mb-4">${text}</p>`;
  };

  const rendered = marked(markdown, { renderer });

  return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
}
