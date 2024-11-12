import fs from "fs/promises";
import { join } from "path";
import { Fragment } from "./interface";
import { Div, H2, Img } from "../../utils/simple-components";
import { marked } from "marked";

const HeadingToTextSizeMapping = {
  1: "text-xl",
  2: "text-lg",
  3: "text-md",
  4: "text-sm",
  5: "text-sm",
  6: "text-sm",
};

export class Gallery implements Fragment {
  constructor(private context: {}) {}

  async render(params: { id: string }) {
    return Div({
      class: "bg-white shadow-md p-4 max-w-5xl mx-auto flex gap-2",
    })(
      Div({ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3" })(
        Div({ class: "flex flex-col justify-center" })(
          H2({ class: "text-3xl font-bold text-gray-600 mb-4 text-center " })(
            "Florida Championships over the years",
          ),
        ),
        Div()(Img({ src: "/gallery/photo1.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo2.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo3.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo4.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo5.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo8.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo7.jpg", class: "inline-block" })()),
        Div()(Img({ src: "/gallery/photo9.jpg", class: "inline-block" })()),
      ),
    );
  }
}
