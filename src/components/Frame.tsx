"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Head from "next/head";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
  type FrameContext,
  type OembedPhotoData,
} from "@farcaster/frame-sdk";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

function ExampleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to the Frame Template</CardTitle>
        <CardDescription>
          This is an example card that you can customize or remove
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label>Place content in a Card here.</Label>
      </CardContent>
    </Card>
  );
}

export default function Frame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context2d, setContext2d] = useState<CanvasRenderingContext2D>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Setup canvas context and resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setContext2d(ctx);
    ctx.imageSmoothingEnabled = true;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width } = entry.contentRect;
      canvas.width = width;
      canvas.height = width; // Maintain 1:1 aspect ratio
    });

    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // Get frame context from SDK
        const frameContext = await sdk.context;
        if (!frameContext) {
          console.error("No frame context available");
          return;
        }

        setContext(frameContext);
        setAdded(frameContext.client.added);

        // Extract profile image URL from frame context if available
        if (frameContext.user?.pfp?.url) {
          setProfileImage(frameContext.user.pfp.url);
          console.log("Profile image URL:", frameContext.user.pfp.url);
        } else if (frameContext.user?.pfp?.oembedPhotoData) {
          // Handle oembed photo data format
          const oembedData = frameContext.user.pfp.oembedPhotoData as OembedPhotoData;
          if (oembedData.url) {
            setProfileImage(oembedData.url);
            console.log("Profile image from oembed:", oembedData.url);
          }
        } else {
          console.log("No profile image found in frame context");
        }

        // If frame isn't already added, prompt user to add it
        if (!frameContext.client.added) {
          addFrame();
        }

        // Set up event listeners
        sdk.on("frameAdded", ({ notificationDetails }) => {
          setAdded(true);
          console.log("Frame added", notificationDetails);
        });

        sdk.on("frameAddRejected", ({ reason }) => {
          console.log("frameAddRejected", reason);
        });

        sdk.on("frameRemoved", () => {
          console.log("frameRemoved");
          setAdded(false);
        });

        sdk.on("notificationsEnabled", ({ notificationDetails }) => {
          console.log("notificationsEnabled", notificationDetails);
        });
        
        sdk.on("notificationsDisabled", () => {
          console.log("notificationsDisabled");
        });

        // Signal to the Frame SDK that we're ready to display content
        console.log("Calling ready");
        sdk.actions.ready({});
      } catch (error) {
        console.error("Error initializing Frame SDK:", error);
      }
    };
    
    if (sdk && !isSDKLoaded) {
      console.log("Initializing Frame SDK");
      setIsSDKLoaded(true);
      load();
      
      // Clean up event listeners when component unmounts
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
      </Head>
      <div 
        className="grid h-screen grid-rows-[auto_1fr] gap-4 overflow-y-hidden"
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
          height: '100dvh' // Use dynamic viewport height
        }}
      >
        <main className="grid place-items-center px-4 py-8">
          <div className="w-full max-w-[512px] mx-auto relative">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[512px] aspect-square bg-neutral-100 rounded-lg"
              style={{
                maxWidth: 'min(90vw, 512px)',
                maxHeight: 'min(90vh, 512px)'
              }}
            />
            {profileImage && (
              <div className="mt-2 text-sm text-center text-gray-500">
                Profile image loaded from Frame context
              </div>
            )}
            {!isSDKLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                <div className="text-lg font-medium">Initializing Frame SDK...</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
