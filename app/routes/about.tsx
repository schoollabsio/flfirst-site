import type { MetaFunction } from "@remix-run/node";
import { Markdown } from "~/components/markdown";
import about from "./static/about.md?raw";

export const meta: MetaFunction = () => {
  return [
    { title: "About | Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function About() {
  return (
    <div className="bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2">
      <Markdown markdown={about}/>
    </div>
  );
}
