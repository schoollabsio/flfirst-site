import { Div, H2, Img } from "../utils/simple-components";

const ContentPageHeading = ({ text, image }: { text: string; image: string }) =>
  Div({
    class: "relative z-0 -mt-4 -mx-4",
  })(
    Img({
      src: image,
      alt: "Logo",
    })(),
    Div({
      class: "h-full absolute top-0 left-0 flex flex-col justify-end",
    })(
      H2({
        class:
          "text-6xl font-bold text-white bg-black w-auto py-6 px-4 opacity-80",
      })(text),
    ),
  );

export default ContentPageHeading;
