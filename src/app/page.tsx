import { Metadata } from "next";
import Frame from "~/components/Frame";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  "http://localhost:3000";

const frame = {
  version: "vNext",
  imageUrl: `${appUrl}/opengraph-image.png`,
  button: {
    title: "Pinkify My Profile",
    action: {
      type: "launch_frame",
      name: PROJECT_TITLE,
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#fdf2f8",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PROJECT_TITLE,
    metadataBase: new URL(appUrl),
    openGraph: {
      title: PROJECT_TITLE,
      description: PROJECT_DESCRIPTION,
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: PROJECT_TITLE,
        }
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      "fc:frame:image": `${appUrl}/opengraph-image.png`,
      "fc:frame:post_url": appUrl,
    },
  };
}

export default function Home() {
  return <Frame />;
}
