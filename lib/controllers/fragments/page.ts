import { Fragment } from "./interface.ts";

export class Page implements Fragment {

    constructor(private ctx: {}) {}

    async render(params: {}, query: { page: string }) {
        return `
            <div fragment-id="${query.page}">
        `;
    }
}
