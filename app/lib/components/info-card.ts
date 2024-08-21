import { Div, H2, H3, If } from "../utils/simple-components";

export const InfoCardHeader = (
  title: string,
  secondaryContent?: string | null
) => {
  return Div({
    class: "flex justify-between",
  })(
    H2({ class: "text-xl" })(title),
    If(!!secondaryContent)(
      H3({ class: "text-md text-gray-400 hover:text-blue-600 italic" })(
        secondaryContent || ""
      ),
      ""
    )
  );
};

export const InfoCard = Div({
  class: "flex flex-col bg-white p-4 border shadow-sm gap-4",
});

export const InfoCardContent = Div({
    class: "flex",
  });

export const InfoCardColumn = Div({
  class: "flex flex-col flex-1 gap-2",
});

export const InfoCardFooter = (children: string) => {
  return Div({
    class: "border-t p-4 border-gray-200",
  })(
    Div({
      class: "flex justify-end",
    })(children)
  );
};

export const InfoCardAttribute = (
  label: string,
  value: string | null,
  shouldDisplay: boolean = true
) => {
  if (!shouldDisplay) {
    return "";
  }

  return Div({
    class: "flex flex-col",
  })(
    Div({
      class: "text-gray-500 text-sm",
    })(label.toUpperCase()),
    Div({
      class: "text-md",
    })(value || "")
  );
};
