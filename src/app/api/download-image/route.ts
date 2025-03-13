import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic'; // Prevent static optimization

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const intensity = Number(searchParams.get('intensity'));
    const filename = searchParams.get('filename') || 'pinkified-profile.png';

    // Validate inputs
    if (!imageUrl || isNaN(intensity) || intensity < 0 || intensity > 100) {
      return new Response(JSON.stringify({ 
        error: 'Invalid parameters',
        message: 'Please provide valid image URL and intensity (0-100)' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch original image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Frame-Pinkifier/1.0)'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'Image fetch failed',
        message: `Failed to fetch image from ${imageUrl} (status ${response.status})`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process image with sharp
    const imageBuffer = await response.arrayBuffer();
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .composite([{
        input: Buffer.from(`
          <svg width="100%" height="100%">
            <rect width="100%" height="100%" 
                  fill="rgba(215,23,169,${Math.min(intensity/100 * 0.7, 0.7)})"
                  style="mix-blend-mode: multiply"/>
          </svg>
        `),
        blend: 'over'
      }])
      .png({ quality: 90, progressive: true })
      .toBuffer();

    return new Response(processedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'CDN-Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
