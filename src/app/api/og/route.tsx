import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export const runtime = "edge";

export async function GET() {
  const BACKGROUND_GRADIENT_START = "#ff80bf";
  const BACKGROUND_GRADIENT_END = "#ec4899";
  const BACKGROUND_GRADIENT_STYLE = {
    backgroundImage: `linear-gradient(to bottom, ${BACKGROUND_GRADIENT_START}, ${BACKGROUND_GRADIENT_END})`,
    color: "white",
  };

  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={BACKGROUND_GRADIENT_STYLE}
      >
        <h1 tw="text-9xl text-center font-semibold">{PROJECT_TITLE}</h1>
        <h3 tw="text-4xl font-normal">{PROJECT_DESCRIPTION}</h3>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
    }
  );
}
