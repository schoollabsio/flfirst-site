import fs from "fs/promises";
import { join } from "path";
import { Fragment } from "./interface";
import { Div, H2, Img } from "../../utils/simple-components";
import { marked } from "marked";
import ContentPageHeading from "../../components/content-page-heading";

const HeadingToTextSizeMapping = {
  1: "text-xl",
  2: "text-lg",
  3: "text-md",
  4: "text-sm",
  5: "text-sm",
  6: "text-sm",
};

export class Cover implements Fragment {
  constructor(
    private context: {
      fs: typeof fs;
      marked: typeof marked;
    },
  ) {}

  get filepath() {
    return join(__dirname, "..", "..", "..", "..", "static", "cover.md");
  }

  async page() {
    try {
      const fileContents = await this.context.fs.readFile(
        this.filepath,
        "utf-8",
      );
      return fileContents;
    } catch (error) {
      console.error("Error loading about page:", error);
      return "";
    }
  }

  async content() {
    const page = await this.page();

    const renderer = new this.context.marked.Renderer();
    renderer.heading = (value) => {
      return `<h${value.depth} class="${HeadingToTextSizeMapping[value.depth as keyof typeof HeadingToTextSizeMapping]} font-bold">${value.text}</h${value.depth}>`;
    };
    renderer.list = (value) => {
      return `<ol class="list-decimal list-inside">${value.items.map((t) => `<li>${t.text}</li>`).join("\n")}</ol>`;
    };
    renderer.link = ({ href, title, text }) => {
      return `<a href="${href}" class="text-gray-500 underline hover:text-blue-600">${text}</a>`;
    };
    renderer.paragraph = (value) => {
      const text = renderer.parser.parseInline(value.tokens);
      return `<p class="[&:not(:last-child)]:mb-4">${text}</p>`;
    };

    const rendered = await this.context.marked(page, { renderer });

    return rendered;
  }

  async render(params: { id: string }) {
    return Div({
      class: "bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2",
    })(
      ContentPageHeading({
        text: "Florida FIRST Tech Challenge",
        image: "cover.jpg",
      }),
      Div()((await this.content()) || "No content found"),
    );
  }
}
