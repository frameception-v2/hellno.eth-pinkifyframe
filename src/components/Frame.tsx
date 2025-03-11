"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, {
  AddFrame,
  type FrameContext,
} from "@farcaster/frame-sdk";
import { PROJECT_TITLE } from "~/lib/constants";


export default function Frame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context2d, setContext2d] = useState<CanvasRenderingContext2D>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | undefined>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(() => {
    // Try to load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinkify-intensity');
      return saved ? parseInt(saved, 10) : 50;
    }
    return 50; // Default intensity
  });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Function to apply pink filter to the image
  const applyPinkFilter = useCallback((img: HTMLImageElement, intensity: number) => {
    if (!context2d || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = context2d;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply pink overlay with intensity
    const alpha = intensity / 100;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255, 192, 203, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    setImageLoaded(true);
  }, [context2d]);
  
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
    
    // Set up passive touch event listeners for better mobile performance
    const sliderElement = document.querySelector('input[type="range"]');
    if (sliderElement) {
      const options = { passive: true };
      sliderElement.addEventListener('touchstart', () => {}, options);
      sliderElement.addEventListener('touchmove', () => {}, options);
      
      return () => {
        resizeObserver.disconnect();
        if (sliderElement) {
          sliderElement.removeEventListener('touchstart', () => {}, options);
          sliderElement.removeEventListener('touchmove', () => {}, options);
        }
      };
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Load and process profile image when URL changes
  useEffect(() => {
    if (!profileImage || !context2d || !canvasRef.current) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      applyPinkFilter(img, intensity);
    };
    
    img.onerror = (e) => {
      console.error('Error loading image:', e);
      setImageLoaded(false);
      
      // Try alternative CORS proxy if first attempt failed
      if (profileImage && profileImage.startsWith('https://corsproxy.io')) {
        console.log('First CORS proxy failed, trying alternative...');
        const originalUrl = decodeURIComponent(profileImage.replace('https://corsproxy.io/?', ''));
        const alternativeProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
        
        const retryImg = new Image();
        retryImg.crossOrigin = 'anonymous';
        retryImg.onload = () => {
          applyPinkFilter(retryImg, intensity);
        };
        retryImg.onerror = () => {
          console.error('All CORS proxies failed, using fallback image');
          loadFallbackImage();
        };
        retryImg.src = alternativeProxy;
      } else {
        loadFallbackImage();
      }
    };
    
    // Helper function to load fallback image
    const loadFallbackImage = () => {
      const fallbackImg = new Image();
      fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
      fallbackImg.onload = () => {
        applyPinkFilter(fallbackImg, intensity);
      };
    };
    
    img.src = profileImage;
  }, [profileImage, context2d, applyPinkFilter, intensity]);
  
  // Update filter when intensity changes
  useEffect(() => {
    if (!profileImage || !imageLoaded) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      applyPinkFilter(img, intensity);
    };
    
    img.src = profileImage;
  }, [intensity, applyPinkFilter, profileImage, imageLoaded]);

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
        let imageUrl = null;
        
        if (frameContext.user?.pfp?.url) {
          imageUrl = frameContext.user.pfp.url;
          console.log("Profile image URL:", imageUrl);
        } else if (frameContext.user?.pfp?.oembedPhotoData) {
          // Handle oembed photo data format
          const oembedData = frameContext.user.pfp.oembedPhotoData;
          if (oembedData.url) {
            imageUrl = oembedData.url;
            console.log("Profile image from oembed:", imageUrl);
          }
        } else {
          console.log("No profile image found in frame context");
        }
        
        // Apply CORS proxy if needed for cross-origin images
        if (imageUrl) {
          // Check if URL is from a different origin and needs a proxy
          try {
            const urlObj = new URL(imageUrl);
            const isExternalDomain = urlObj.origin !== window.location.origin;
            
            if (isExternalDomain) {
              // Use a CORS proxy for external images
              // Options: 
              // 1. Cloudflare Worker CORS Proxy
              // 2. imgproxy.net
              // 3. cors-anywhere (for development)
              const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
              setProfileImage(corsProxyUrl);
              console.log("Using CORS proxy for image:", corsProxyUrl);
            } else {
              setProfileImage(imageUrl);
            }
          } catch (error) {
            console.error("Invalid image URL:", error);
            setProfileImage(imageUrl); // Try direct URL as fallback
          }
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
                {imageLoaded 
                  ? "Profile image loaded from Frame context" 
                  : "Loading profile image..."}
              </div>
            )}
            {!isSDKLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                <div className="text-lg font-medium">Initializing Frame SDK...</div>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 w-full max-w-[512px]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium min-w-16">Pink Intensity</span>
                <div className="relative w-full">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value, 10);
                      setIntensity(newValue);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pinkify-intensity', newValue.toString());
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer touch-manipulation"
                    style={{
                      background: `linear-gradient(to right, #ffc0cb ${intensity}%, #f3f4f6 ${intensity}%)`,
                      touchAction: 'none', // Prevent scrolling when using the slider
                      // Custom thumb styling for better touch targets
                      WebkitAppearance: 'none',
                      appearance: 'none',
                    }}
                  />
                  {/* Custom thumb styling with larger touch target */}
                  <style jsx>{`
                    input[type=range]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #ec4899;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      transition: transform 0.1s;
                    }
                    
                    input[type=range]::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #ec4899;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      transition: transform 0.1s;
                    }
                    
                    input[type=range]:active::-webkit-slider-thumb {
                      transform: scale(1.2);
                    }
                    
                    input[type=range]:active::-moz-range-thumb {
                      transform: scale(1.2);
                    }
                  `}</style>
                </div>
                <span className="text-sm min-w-8">{intensity}%</span>
              </div>
              
              <button
                onClick={() => {
                  if (!canvasRef.current) return;
                  
                  // Create download link
                  const link = document.createElement('a');
                  link.download = `pinkified-profile-${Date.now()}.png`;
                  link.href = canvasRef.current.toDataURL('image/png');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                disabled={!imageLoaded}
                className="mt-2 px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download PNG
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
