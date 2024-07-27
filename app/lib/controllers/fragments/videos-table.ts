import { Fragment } from "./interface";

export class VideosTable implements Fragment {
  constructor(private ctx: {}) {}

  async render(params: { id: string }) {
    return `
            <div>
                <h1 class="text-4xl font-bold text-center text-gray-900">Videos</h1>
                <div class="text-center mt-5">
                    <div>Season videos will go here!</div>               
                </div>
            </div>
        `;
  }
}
