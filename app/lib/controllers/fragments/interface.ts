export interface Fragment {
  render(params: unknown, query: unknown): Promise<string>;
}

export type Params = {
  [key: string]: string;
};

export type Query = {
  [key: string]: string;
};
