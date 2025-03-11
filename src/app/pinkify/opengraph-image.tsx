import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export const alt = PROJECT_TITLE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ff80bf',
          backgroundImage: 'linear-gradient(to bottom, #ff80bf, #ec4899)',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: 72, fontWeight: 600, textAlign: 'center' }}>{PROJECT_TITLE}</h1>
        <h3 style={{ fontSize: 36, fontWeight: 400 }}>{PROJECT_DESCRIPTION}</h3>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
