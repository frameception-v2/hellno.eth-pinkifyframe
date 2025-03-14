import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";
import { join } from "path";
import fs from "fs";

export const alt = PROJECT_TITLE;
export const contentType = "image/png";

// Function to load font with error handling
async function loadFont(fontPath: string) {
  try {
    const fontData = fs.readFileSync(fontPath);
    return fontData;
  } catch (error) {
    // Fallback to loading from absolute path
    try {
      const absolutePath = join(
        process.cwd(),
        "public",
        "fonts",
        fontPath.split("/").pop() || ""
      );
      return fs.readFileSync(absolutePath);
    } catch (fallbackError) {
      console.error(`Failed to load font ${fontPath}:`, error);
      // Return an empty buffer as last resort
      return new ArrayBuffer(0);
    }
  }
}

// Create reusable options object
let imageOptions: any = null;

// Initialize fonts
async function initializeFonts() {
  if (imageOptions) return imageOptions;

  try {
    const fontUrl = `${process.env.NEXTAUTH_URL}/fonts/Nunito-Regular.ttf`;
    const semiBoldFontUrl = `${process.env.NEXTAUTH_URL}/fonts/Nunito-SemiBold.ttf`;
    
    const [regularResponse, semiBoldResponse] = await Promise.all([
      fetch(fontUrl),
      fetch(semiBoldFontUrl)
    ]);
    
    const regularFont = await regularResponse.arrayBuffer();
    const semiBoldFont = await semiBoldResponse.arrayBuffer();

    imageOptions = {
      width: 1200,
      height: 800,
      fonts: [
        {
          name: "Nunito",
          data: regularFont,
          weight: 400,
          style: "normal",
        },
        {
          name: "Nunito",
          data: semiBoldFont,
          weight: 600,
          style: "normal",
        },
      ],
    };

    return imageOptions;
  } catch (error) {
    throw error;
  }
}

export default async function Image() {
  let options;
  try {
    options = await initializeFonts();
  } catch (error) {
    console.error("Failed to initialize fonts:", error);
    // Fallback to basic options without custom fonts
    options = {
      width: 1200,
      height: 800,
    };
  }

  const BACKGROUND_GRADIENT_START = "#ff80bf";
  const BACKGROUND_GRADIENT_END = "#ec4899";
  const BACKGROUND_GRADIENT_STYLE = {
    backgroundImage: `linear-gradient(to bottom, ${BACKGROUND_GRADIENT_START}, ${BACKGROUND_GRADIENT_END})`,
    color: "white",
  };

  /*
this Image is rendered using vercel/satori.

Satori supports a limited subset of HTML and CSS features, due to its special use cases. In general, only these static and visible elements and properties that are implemented.
For example, the <input> HTML element, the cursor CSS property are not in consideration. And you can't use <style> tags or external resources via <link> or <script>.
Also, Satori does not guarantee that the SVG will 100% match the browser-rendered HTML output since Satori implements its own layout engine based on the SVG 1.1 spec.
Please refer to Satori’s documentation for a list of supported HTML and CSS features. https://github.com/vercel/satori#css
*/
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
    options
  );
}
