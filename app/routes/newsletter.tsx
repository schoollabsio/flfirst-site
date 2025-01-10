import type { MetaFunction } from "@remix-run/node";
import { Markdown } from "~/components/markdown";

// todo: well isn't this a right mess
import Newsletter2024Aug21 from "./static/newsletters/2024-08-21_all-new-website.md?raw";
import Newsletter2024Sep11 from "./static/newsletters/2024-09-11_email.md?raw";
import Newsletter2024Sep21 from "./static/newsletters/2024-09-21_newsletter-5.md?raw";
import Newsletter2024Oct17 from "./static/newsletters/2024-10-17_newsletter-6.md?raw";
import Newsletter2024Oct31 from "./static/newsletters/2024-10-31_newsletter-7.md?raw";
import Newsletter2024Nov10 from "./static/newsletters/2024-11-10_newsletter-8.md?raw";
import Newsletter2024Nov14 from "./static/newsletters/2024-11-14_newsletter-9.md?raw";
import Newsletter2024Nov24 from "./static/newsletters/2024-11-24_newsletter-10.md?raw";
import Newsletter2024Dec10 from "./static/newsletters/2024-12-10_newsletter-11.md?raw";
import Newsletter2025Jan6 from "./static/newsletters/2025-01-06_newsletter-12.md?raw";

import Newsletter2025Jan6Summary from "./static/newsletters/summaries/2025-01-06_newsletter-12.md?raw";
import Newsletter2024Dec10Summary from "./static/newsletters/summaries/2024-12-10_newsletter-11.md?raw";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Newsletter | Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const Post = ({ children }: { children: React.ReactElement }) => {
  return (
    <div className="bg-white shadow-md p-4 max-w-prose">
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};

const MarkdownPost = ({
  content,
  summary,
}: {
  content: string;
  summary?: string;
}) => {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="flex gap-4">
      <Post>
        <div className="relative">
          {summary && (
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex md:hidden min-w-36 justify-center bg-gray-100/90 px-8 py-4 rounded-sm absolute top-1 right-1 text-md text-gray-500"
            >
              {showSummary ? "Original" : "Summary"}
            </button>
          )}
          <div
            className={`italic text-gray-600 ${showSummary ? "block" : "hidden"} sm:hidden`}
          >
            <Markdown markdown={summary ?? ""} />
          </div>
          <div className={`${showSummary ? "hidden" : "block"} sm:block`}>
            <Markdown markdown={content} />
          </div>
        </div>
      </Post>
      <div className="hidden md:flex flex-col gap-4 italic text-gray-500 text-sm w-96">
        {summary && <Markdown markdown={summary} />}
      </div>
    </div>
  );
};

export default function Newsletter() {
  return (
    <div className="flex flex-col mx-auto gap-4">
      <MarkdownPost
        content={Newsletter2025Jan6}
        summary={Newsletter2025Jan6Summary}
      />
      <MarkdownPost
        content={Newsletter2024Dec10}
        summary={Newsletter2024Dec10Summary}
      />
      <MarkdownPost content={Newsletter2024Nov24} />
      <MarkdownPost content={Newsletter2024Nov14} />
      <MarkdownPost content={Newsletter2024Nov10} />
      <MarkdownPost content={Newsletter2024Oct31} />
      <MarkdownPost content={Newsletter2024Oct17} />
      <MarkdownPost content={Newsletter2024Sep21} />
      <MarkdownPost content={Newsletter2024Sep11} />
      <MarkdownPost content={Newsletter2024Aug21} />
    </div>
  );
}
