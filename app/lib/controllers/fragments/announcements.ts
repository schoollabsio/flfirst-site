import fs from "fs/promises";
import { Fragment } from "./interface";
import { join } from "path";
import { marked } from "marked";

interface AnnoucementsContext {
  fs: typeof fs;
  marked: typeof marked;
}

const HeadingToTextSizeMapping = {
  1: "text-xl",
  2: "text-lg",
  3: "text-md",
  4: "text-sm",
  5: "text-sm",
  6: "text-sm",
};

/**
 * 
 * <h2 class="text-xl font-bold mb-2">Welcome to Florida FTC</h2>
      <p>July 14, 2024</p>
      <br/>
 */
const Post = (content: string): string => `
  <div class="bg-white shadow-md p-4">
      
      <div class="flex flex-col gap-4">
          ${content}
      </div>
  </div>
`;

export class Announcements implements Fragment {
  constructor(private context: AnnoucementsContext) {}

  async pages() {
    const announcementsDir = join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "static",
      "announcements",
    );
    try {
      const files = await this.context.fs.readdir(announcementsDir);
      const fileContents = await Promise.all(
        files.map((file) =>
          this.context.fs.readFile(join(announcementsDir, file), "utf-8"),
        ),
      );
      return fileContents;
    } catch (error) {
      console.error("Error reading files from announcements directory:", error);
      return [];
    }
  }

  async render(params: { id: string }) {
    const renderer = new this.context.marked.Renderer();
    renderer.heading = (value) => {
      return `<h${value.depth} class="${HeadingToTextSizeMapping[value.depth as keyof typeof HeadingToTextSizeMapping]} font-bold">${value.text}</h${value.depth}>`;
    };
    renderer.list = (value) => {
      return `<ol class="list-decimal list-inside">${value.items.map((t) => `<li>${t.text}</li>`).join("\n")}</ol>`;
    };
    renderer.link = ({ href, title, text }) => {
      return `<a href="${href}" class="text-gray-500 underline hover:text-blue-600">${text}</a>`;
    }
    const pages = (await this.pages()).reverse();
    const rendered = (
      await Promise.all(
        pages.map(
          async (page) => await this.context.marked(page, { renderer }),
        ),
      )
    )
      .map(Post)
      .join("\n");
    return `
            <div class="flex flex-col max-w-prose mx-auto gap-4">
              ${rendered}
            </div>
        `;
  }
}
