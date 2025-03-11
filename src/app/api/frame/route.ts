import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Process frame interaction
    return NextResponse.json({ 
      status: 'success',
      message: 'Frame interaction processed'
    });
  } catch (error) {
    console.error('Error processing frame interaction:', error);
    return NextResponse.json(
      { error: 'Failed to process frame interaction' },
      { status: 500 }
    );
  }
}
