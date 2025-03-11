import type { Metadata } from "next";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { getSession } from "~/auth";

const appUrl =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  title: PROJECT_TITLE,
  description: PROJECT_DESCRIPTION,
  metadataBase: new URL(appUrl),
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
          <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
