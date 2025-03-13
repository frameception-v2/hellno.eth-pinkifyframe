import { NextResponse } from "next/server";
import sharp from "sharp";
import { PROJECT_TITLE } from "~/lib/constants";
import { COLOR_MAP } from "~/lib/colors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("imageUrl");
  const intensity = Number(searchParams.get("intensity")) || 50;
  const color = searchParams.get("color") as keyof typeof COLOR_MAP || "Pink";
  console.log('download searchParams', searchParams)

  try {
    // Validate parameters
    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Invalid image URL");
    }
    if (intensity < 0 || intensity > 100) {
      throw new Error("Invalid intensity value");
    }
    if (!Object.keys(COLOR_MAP).includes(color)) {
      throw new Error("Invalid color selection");
    }

    // Fetch original image with 5s timeout
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imageResponse.ok) throw new Error("Failed to fetch image");
    
    // Process image with sharp
    const buffer = await imageResponse.arrayBuffer();
    
    // Get color from map and convert to RGB
    const colorHex = COLOR_MAP[color];
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    
    // Match frontend's alpha calculation
    let alpha = Math.pow(intensity / 100, 0.7);
    if (intensity > 50) {
      const transitionFactor = (intensity - 50) / 50;
      alpha = alpha * (1 - transitionFactor) + transitionFactor;
    }
    
    const processedImage = await sharp(Buffer.from(buffer))
      .composite([{
        input: Buffer.from(
          `<svg width="100%" height="100%">
            <rect width="100%" height="100%" fill="rgba(${r}, ${g}, ${b}, ${alpha})" />
          </svg>`
        ),
        blend: intensity === 100 ? 'over' : 'multiply'
      }])
      .png()
      .toBuffer();

    // Create response with proper headers
    const filename = `${PROJECT_TITLE.toLowerCase().replace(/\s+/g, '-')}-${color.toLowerCase()}-${Date.now()}.png`;
    return new Response(processedImage, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Image processing error:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: String(error) },
      { status: 400 }
    );
  }
}
