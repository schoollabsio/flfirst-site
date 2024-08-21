import { Div } from "../utils/simple-components";
import { Fragment, Params, Query } from "./fragments/interface";

export class FragmentController {
  constructor(
    private ctx: {
      fragments: {
        [key: string]: Fragment;
      };
    },
  ) {}

  async load(params: Params, query: Query): Promise<string> {
    if (!params["id"]) throw new Error("No fragment id provided");

    const fragment =
      this.ctx.fragments[params["id"] as keyof typeof this.ctx.fragments];

    if (!fragment) return Div()("Not found");

    return this.ctx.fragments[
      params["id"] as keyof typeof this.ctx.fragments
    ].render(params, query);
  }
}
