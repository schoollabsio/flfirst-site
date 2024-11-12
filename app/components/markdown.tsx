import { marked } from "marked";

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

export function Markdown({ markdown }: MarkdownProps) {
  const renderer = new marked.Renderer();

  renderer.heading = (value) => {
    return `<h${value.depth} class="${HeadingToTextSizeMapping[value.depth as keyof typeof HeadingToTextSizeMapping]} font-bold mb-2">${value.text}</h${value.depth}>`;
  };
  renderer.list = (value) => {
    if (value.ordered) {
      return `<ol class="list-decimal list-inside mb-4">${value.items.map((t) => `<li>${t.text}</li>`).join("\n")}</ol>`;
    }
    return `<ul class="list-disc list-inside mb-4">${value.items.map((t) => `<li>${t.text}</li>`).join("\n")}</ul>`;
  };

  renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" class="text-gray-500 underline hover:text-blue-600">${text}</a>`;
  };

  renderer.paragraph = (value) => {
    const text = renderer.parser.parseInline(value.tokens);
    return `<p class="[&:not(:last-child)]:mb-4">${text}</p>`;
  };

  const rendered = marked(markdown, { renderer });

  return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
}
