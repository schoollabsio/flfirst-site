import { Fragment } from "./interface";

export class Page implements Fragment {
  constructor(private ctx: {}) {}

  async render(params: {}, query: { page: string }) {
    return `
            <div fragment-id="${query.page}">
        `;
  }
}
