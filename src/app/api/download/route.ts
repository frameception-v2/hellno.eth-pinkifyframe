import { NextResponse } from "next/server";
import sharp from "sharp";
import { PROJECT_TITLE } from "~/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("imageUrl");
  const intensity = Number(searchParams.get("intensity")) || 50;
  console.log('download searchParams', searchParams)

  try {
    // Validate parameters
    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Invalid image URL");
    }
    if (intensity < 0 || intensity > 100) {
      throw new Error("Invalid intensity value");
    }

    // Fetch original image with 5s timeout
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imageResponse.ok) throw new Error("Failed to fetch image");
    
    // Process image with sharp
    const buffer = await imageResponse.arrayBuffer();
    const processedImage = await sharp(Buffer.from(buffer))
      .composite([{
        input: Buffer.from(
          `<svg width="100%" height="100%">
            <rect width="100%" height="100%" fill="rgba(255,105,180,${intensity / 100 * 0.8})" />
          </svg>`
        ),
        blend: intensity === 100 ? 'over' : 'multiply'
      }])
      .png()
      .toBuffer();

    // Create response with proper headers
    return new Response(processedImage, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${PROJECT_TITLE.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png"`,
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
