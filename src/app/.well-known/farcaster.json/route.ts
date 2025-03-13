import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    "accountAssociation": {
      "header": "eyJmaWQiOjEzNTk2LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4ODE3MzE4RDZmRkY2NkExOGQ4M0ExMzc2QTc2RjZlMzBCNDNjODg4OSJ9",
      "payload": "eyJkb21haW4iOiJjdGctcGZwLnZlcmNlbC5hcHAifQ",
      "signature": "MHhmNzdjZjExYTUzZWIzYmNmZDQ1NjdlOWNhNjFlYTFiMGY5MTgyODk1NDljZGI4N2NiYjIxM2NkNzZjM2IwNTdhMGZkM2QyM2EwYWU1NGVhMTUxNTFiMDczMTcwODkzMjFkOWUwYTI1YWNmOGY1NzNhMzg3NzkyYzE4ZGE4NTlhODFi"
    },
    frame: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/opengraph-image`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#d717a9",
      // webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
