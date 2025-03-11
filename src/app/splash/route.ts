import { ImageResponse } from 'next/og';
import { PROJECT_TITLE } from '~/lib/constants';
 
export const runtime = 'edge';
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: '#fdf2f8',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ec4899',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#ec4899" />
            <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontWeight: 'bold' }}>Loading {PROJECT_TITLE}...</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
