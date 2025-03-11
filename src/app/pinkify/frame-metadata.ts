import { Metadata } from "next";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export function generateFrameMetadata(baseUrl: string): Metadata {
  const imageUrl = `${baseUrl}/opengraph-image`;
  
  return {
    title: PROJECT_TITLE,
    description: PROJECT_DESCRIPTION,
    openGraph: {
      title: PROJECT_TITLE,
      description: PROJECT_DESCRIPTION,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: PROJECT_TITLE,
        },
      ],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:image:aspect_ratio": "1:1",
      "fc:frame:post_url": `${baseUrl}/api/frame`,
      "fc:frame:button:1": "Pinkify My Profile",
      "fc:frame:button:1:action": "post",
      "fc:frame:input:text": "Pink intensity (0-100)",
    },
  };
}
