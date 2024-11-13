import type { MetaFunction } from "@remix-run/node";
import { Markdown } from "~/components/markdown";
import NewsletterAug21 from "./static/newsletters/2024-08-21_all-new-website.md?raw";
import NewsletterSep11 from "./static/newsletters/2024-09-11_email.md?raw";
import NewsletterSep21 from "./static/newsletters/2024-09-21_newsletter-5.md?raw";
import NewsletterOct17 from "./static/newsletters/2024-10-17_newsletter-6.md?raw";
import NewsletterOct31 from "./static/newsletters/2024-10-31_newsletter-7.md?raw";

export const meta: MetaFunction = () => {
  return [
    { title: "Newsletter | Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const Post = ({ children }: { children: React.ReactElement }) => {
  return (
    <div className="bg-white shadow-md p-4">
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};

const MarkdownPost = ({ content }: { content: string }) => {
  return (
    <Post>
      <Markdown markdown={content} />
    </Post>
  );
};

export default function Newsletter() {
  return (
    <div className="flex flex-col max-w-prose mx-auto gap-4">
      <MarkdownPost content={NewsletterOct31} />
      <MarkdownPost content={NewsletterOct17} />
      <MarkdownPost content={NewsletterSep21} />
      <MarkdownPost content={NewsletterSep11} />
      <MarkdownPost content={NewsletterAug21} />
    </div>
  );
}
