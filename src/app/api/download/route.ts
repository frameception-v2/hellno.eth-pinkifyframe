import { NextResponse } from "next/server";
import sharp from "sharp";
import { PROJECT_TITLE } from "~/lib/constants";
import { COLOR_MAP } from "~/lib/colors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("imageUrl");
  const intensity = Number(searchParams.get("intensity")) || 50;
  const color = searchParams.get("color") as keyof typeof COLOR_MAP || "Pink";
  const isPreview = searchParams.get("preview") === "true";
  const isDownload = searchParams.get("download") === "true";

  try {
    if (!imageUrl) throw new Error("Invalid image URL");
    if (intensity < 0 || intensity > 100) throw new Error("Invalid intensity value");
    if (!Object.keys(COLOR_MAP).includes(color)) throw new Error("Invalid color selection");

    // Handle data URLs for fallback images
    let imageBuffer: Buffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Handle remote URLs
      const imageResponse = await fetch(imageUrl, { 
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ColorFilterBot/1.0)'
        }
      });
      if (!imageResponse.ok) throw new Error("Failed to fetch image");
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    // Parse color values
    const colorHex = COLOR_MAP[color];
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    const overlayAlpha = intensity / 100;

    // Process the image
    const originalImage = sharp(imageBuffer);
    const metadata = await originalImage.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // Create color overlay
    const overlayBuffer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r, g, b, alpha: overlayAlpha }
      }
    }).png().toBuffer();

    // Composite the images
    const processedImage = await originalImage
      .composite([{ input: overlayBuffer, blend: "over" }])
      .png()
      .toBuffer();

    // Generate filename for downloads
    const filename = `${PROJECT_TITLE.toLowerCase().replace(/\s+/g, '-')}-${color.toLowerCase()}-${intensity}-${Date.now()}.png`;
    
    // Return as preview (inline) or download attachment
    if (isPreview && !isDownload) {
      return new Response(processedImage, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60" // Cache previews for 1 minute
        }
      });
    } else {
      return new Response(processedImage, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
  } catch (error) {
    console.error("Image processing error:", error);
    return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 400 });
  }
}
