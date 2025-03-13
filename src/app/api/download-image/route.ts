import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Helper function for error responses
const errorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: 'Processing failed', message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const encodedUrl = searchParams.get('url');
    const intensity = Number(searchParams.get('intensity'));
    const filename = searchParams.get('filename') || 'pinkified-profile.png';

    // Validate inputs
    if (!encodedUrl || isNaN(intensity) || intensity < 0 || intensity > 100) {
      return errorResponse('Invalid parameters - need URL and intensity (0-100)', 400);
    }

    // Decode and validate URL
    let imageUrl: string;
    try {
      imageUrl = decodeURIComponent(encodedUrl);
      new URL(imageUrl); // Validate URL format
    } catch (error) {
      return errorResponse('Invalid URL format after decoding', 400);
    }

    // Validate allowed domains
    const allowedDomains = [
      'imagedelivery.net',
      'pbs.twimg.com',
      'warpcast.com',
      'res.cloudinary.com',
      'i.seadn.io'
    ];
    
    const urlHost = new URL(imageUrl).hostname;
    if (!allowedDomains.some(d => urlHost.endsWith(d))) {
      return errorResponse('Image domain not allowed', 403);
    }

    // Fetch image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Frame-Pinkifier/1.0)' }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return errorResponse(`Failed to fetch image (HTTP ${response.status})`, 400);
    }

    // Process image with sharp
    const imageBuffer = await response.arrayBuffer();
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .composite([{
        input: Buffer.from(
          intensity === 100 ? 
          // Solid overlay for 100% intensity
          `<svg width="100%" height="100%">
            <rect width="100%" height="100%" fill="#d717a9"/>
          </svg>` :
          // Dynamic overlay for other intensities
          (() => {
            const baseAlpha = Math.pow(intensity / 100, 0.7);
            const transitionStart = 50;
            const transitionFactor = Math.min(
              Math.max((intensity - transitionStart) / (100 - transitionStart), 0), 
              1
            );
            const alpha = baseAlpha * (1 - transitionFactor) + transitionFactor;
            const blendMode = transitionFactor > 0 ? 'source-over' : 'multiply';

            return `<svg width="100%" height="100%">
              <rect width="100%" height="100%" 
                    fill="rgba(215,23,169,${alpha})"
                    style="mix-blend-mode: ${blendMode}"/>
            </svg>`;
          })()
        ),
        blend: intensity === 100 ? 'dest-over' : 'multiply'
      }])
      .png({ quality: 90, progressive: true })
      .toBuffer();

    return new Response(processedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600',
        'CDN-Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
