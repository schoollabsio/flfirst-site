import { Fragment } from "./interface";

export class GetInvolved implements Fragment {
  constructor(private ctx: {}) {}

  async render(params: { id: string }) {
    return `
            <div class="bg-white shadow-md p-4 max-w-fit mx-auto">
                <h1 class="text-xl font-bold text-center text-gray-900">Get Involved</h1>
                <div class="mt-5">
                    <div>content</div>               
                </div>
            </div>
        `;
  }
}
