import type { MetaFunction } from "@remix-run/node";
import ContentPageHeading from "~/components/content-page-heading";
import { Markdown } from "~/components/markdown";

import cover from "./static/cover.md?raw";

export const meta: MetaFunction = () => {
  return [
    { title: "Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2">
      <ContentPageHeading text="Florida FIRST Tech Challenge" image="cover.jpg" />
      <Markdown markdown={cover} />
    </div>
  );
}
