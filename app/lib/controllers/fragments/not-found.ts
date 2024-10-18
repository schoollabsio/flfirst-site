import { Fragment } from "./interface";
import {
  A,
  Div,
  H1,
  Img,
  Paragraph,
  Span,
} from "../../utils/simple-components";

export class NotFound implements Fragment {
  constructor(private context: {}) {}

  async render(params: { id: string }) {
    return Div({
      class: "",
    })(
      Div({ class: "flex flex-col md:flex-row gap-4" })(
      Div({ class: "w-full md:w-auto flex justify-center" })(
        Img({ src: "/404.jpg", class: "w-full max-w-md rounded-lg shadow-sm" })(),
      ),
      Div({ class: "w-full md:w-auto" })(
        H1({ class: "text-3xl font-bold text-gray-600 mb-4" })(
        "We looked everywhere, but couldn't find that!"
        ),
        Paragraph()(
        "The page you are looking for doesn't exist or the URL may have changed."
        ),
        Div({ class: "mt-4" })(
        Paragraph()(
          Span()("If you are looking for this season's currently scheduled events, you can try " + A({ href: "/events", class: "text-gray-500 underline hover:text-blue-600" })("here") + ". "),
          Span()("If you are looking for information on <i>Florida FIRST Tech Challenge™</i> teams, you can try ", A({ href: "/teams", class: "text-gray-500 underline hover:text-blue-600" })("here"), ". "),
        ),
        Paragraph()(
          Span()("Additionally, copies of Hans' newsletters can be found ", A({ href: "/newsletter", class: "text-gray-500 underline hover:text-blue-600" })("here"), ". "),
        ),
        )
      )
      )
    );
  }
}
