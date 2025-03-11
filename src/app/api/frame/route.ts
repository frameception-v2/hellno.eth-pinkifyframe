import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const formData = await req.formData();
    const inputText = formData.get('inputText')?.toString() || '50';
    
    // Extract intensity from input if available
    let intensity = 50; // Default value
    if (inputText) {
      const inputValue = parseInt(inputText, 10);
      if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 100) {
        intensity = inputValue;
      }
    }
    
    // Construct the redirect URL with intensity parameter
    const baseUrl = process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_URL || req.nextUrl.origin}`;
    const redirectUrl = `${baseUrl}/pinkify?intensity=${intensity}`;

    // Return a redirect response
    return NextResponse.json({
      frames: {
        version: 'vNext',
        image: `${baseUrl}/api/og`,
        buttons: [
          {
            label: 'Adjust Pink Filter',
            action: 'post_redirect'
          }
        ],
        postUrl: redirectUrl
      }
    });
  } catch (error) {
    console.error("Error processing frame request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
