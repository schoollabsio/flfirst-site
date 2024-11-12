import Component from "./component";

export const DocType = Component("!DOCTYPE html");
export const Html = Component("html");
export const Head = Component("head");
export const Body = Component("body");
export const Meta = Component("meta");
export const Title = Component("title");
export const Div = Component("div");
export const Form = Component("form");
export const Input = Component("input");
export const Button = Component("button");
export const Label = Component("label");
export const Paragraph = Component("p");
export const Select = Component("select");
export const Option = Component("option");
export const Break = Component("br");
export const H1 = Component("h1");
export const H2 = Component("h2");
export const H3 = Component("h3");
export const H4 = Component("h4");
export const H5 = Component("h5");
export const Span = Component("span");
export const Img = Component("img");
export const A = Component("a");
export const I = Component("i");
export const Join = (...c: string[]) => c.join("");
export const Script = Component("script");
export const UnorderedList = Component("ul");
export const ListItem = Component("li");
export const Bold = Component("b");
export const Svg = Component("svg");
export const Path = Component("path");
export const FontWeight = (fontWeight: number) =>
  Component("span")({ style: `font-weight: ${fontWeight};` });
export const Sup = Component("sup");
export const If =
  (conditional: boolean) =>
  (c1: string, c2: string = "") =>
    conditional ? c1 : c2;
