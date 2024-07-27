import { Fragment, Params, Query } from "./fragments/interface";

export class FragmentController {
  constructor(
    private ctx: {
      fragments: {
        [key: string]: Fragment;
      };
    },
  ) {}

  load(params: Params, query: Query): Promise<string> {
    if (!params["id"]) throw new Error("No fragment id provided");

    const fragment =
      this.ctx.fragments[params["id"] as keyof typeof this.ctx.fragments];

    if (!fragment) throw new Error("Fragment not found");

    return this.ctx.fragments[
      params["id"] as keyof typeof this.ctx.fragments
    ].render(params, query);
  }
}
