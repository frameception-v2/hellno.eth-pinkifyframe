"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FrameContext } from "@farcaster/frame-node";
import sdk from "@farcaster/frame-sdk";

// Conditionally import PostHog to prevent build errors
let posthog: any;
let PHProvider: any;

if (typeof window !== 'undefined') {
  try {
    posthog = require('posthog-js').default;
    PHProvider = require('posthog-js/react').PostHogProvider;
  } catch (e) {
    // PostHog is optional, so we can continue without it
    console.warn('PostHog not available:', e);
  }
}

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        persistence: "memory",
        person_profiles: "identified_only",
        loaded: (ph: any) => {
          // Generate anonymous session ID without identifying
          const sessionId = ph.get_distinct_id() || crypto.randomUUID();
          ph.register({ session_id: sessionId });

          // Temporary distinct ID that will be aliased later
          if (!ph.get_distinct_id()) {
            ph.reset(true); // Ensure clean state
          }
        },
      });
    } catch (e) {
      console.error('Error initializing PostHog:', e);
    }
  }, []);

  // If PostHog is not available, just render children
  if (!PHProvider) return <>{children}</>;
  
  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function Providers({
  session,
  children,
}: {
  session?: Session | null;
  children: React.ReactNode;
}) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const load = async () => {
      try {
        const frameContext = await sdk.context;
        if (!frameContext) {
          return;
        }

        setContext(frameContext as unknown as FrameContext);
      } catch (e) {
        console.error('Error loading frame context:', e);
      }
    };
    
    if (sdk && !isSDKLoaded) {
      load();
      setIsSDKLoaded(true);
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    if (!context?.user?.fid || !posthog?.isFeatureEnabled) return;

    try {
      const fidId = `fc_${context?.user?.fid}`;
      const currentId = posthog.get_distinct_id();

      // Skip if already identified with this FID
      if (currentId === fidId) return;

      // Create alias from session ID → FID
      posthog.alias(fidId, currentId);

      // Identify future events with FID
      posthog.identify(fidId, {
        farcaster_username: context.user?.username,
        farcaster_display_name: context.user?.displayName,
        farcaster_fid: context.user?.fid,
      });
    } catch (e) {
      console.error('Error with PostHog identification:', e);
    }
  }, [context?.user]); // Only runs when FID changes

  return (
    <SessionProvider session={session || null}>
      <WagmiProvider>
        <PostHogProvider>{children}</PostHogProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
