import type { MetaFunction } from "@remix-run/node";
import { Markdown } from "~/components/markdown";
import leagues from "./static/leagues.md?raw";
import ContentPageHeading from "~/components/content-page-heading";

export const meta: MetaFunction = () => {
  return [
    { title: "Leagues | Florida FIRST Tech Challenge" },
    {
      name: "description",
      content:
        "Explore the various leagues within the Florida FIRST Tech Challenge and find information about each league's events, teams, and more.",
    },
  ];
};

export default function Leagues() {
  return (
    <div className="bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2">
      <ContentPageHeading text="Leagues" image="leagues.jpg" />
      <Markdown markdown={leagues} />
    </div>
  );
}
