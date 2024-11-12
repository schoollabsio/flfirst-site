type Params = {
  [index: string]: string | number;
};

export default function Component(el: string) {
  return (params: Params = {}) =>
    (...children: string[]) => {
      const openTagContent = [
        `${el}`,
        Object.entries(params)
          .reduce(
            (acc, [key, value]) => [...acc, `${key}="${value}"`],
            [] as string[],
          )
          .join(" "),
      ]
        .filter((e) => !!e)
        .join(" ");
      return [`<${openTagContent}>`, `${children.join("")}`, `</${el}>`].join(
        "\n",
      );
    };
}
