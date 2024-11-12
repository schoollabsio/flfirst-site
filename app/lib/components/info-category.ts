import { Div, H2 } from "../utils/simple-components";

export const InfoCategory = (header: string, rows: string[]) =>
  Div({ class: "mb-8" })(
    H2({ class: "text-2xl font-bold text-gray-600 mb-4 text-center" })(header),
    Div({ class: "flex flex-col gap-4" })(...rows),
  );
