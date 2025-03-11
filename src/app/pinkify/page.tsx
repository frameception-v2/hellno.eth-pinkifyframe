import Frame from "~/components/Frame";
import { generateFrameMetadata } from "./frame-metadata";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 
                 `https://${process.env.VERCEL_URL || 'localhost:3000'}`;
  return generateFrameMetadata(baseUrl);
}

export default function PinkifyPage() {
  return <Frame />;
}
