import { getFrameMetadata } from '@farcaster/frame-sdk';
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from '~/lib/constants';

export function generateFrameMetadata(baseUrl: string) {
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: 'Pinkify My Profile',
      },
    ],
    image: {
      src: `${baseUrl}/pinkify/opengraph-image`,
      aspectRatio: '1:1',
    },
    input: {
      text: 'Enter your name',
    },
    postUrl: `${baseUrl}/api/frame`,
  });

  return {
    title: PROJECT_TITLE,
    description: PROJECT_DESCRIPTION,
    openGraph: {
      title: PROJECT_TITLE,
      description: PROJECT_DESCRIPTION,
      images: [`${baseUrl}/pinkify/opengraph-image`],
    },
    other: {
      ...frameMetadata,
    },
  };
}
