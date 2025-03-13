"use client";

import { useEffect, useState } from "react";
import sdk, { AddFrame } from "@farcaster/frame-sdk";
import { PROJECT_TITLE } from "~/lib/constants";
import type { FrameContext } from "@farcaster/frame-node";
import { ColorSelect } from "./ui/color-select";
import { COLOR_MAP, ColorName } from "~/lib/colors";

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | undefined>();
  const [intensity, setIntensity] = useState<number>(() => {
    // Server-side compatible initial value calculation
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinkify-intensity');
      return saved ? Math.min(Math.max(parseInt(saved), 0), 100) : 50;
    }
    return 50;
  });
  const [selectedColor, setSelectedColor] = useState<ColorName>("Pink");
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [addFrameResult, setAddFrameResult] = useState("");

  // Generate the server-side processed image URL
  const generateProcessedImageUrl = (imageUrl: string) => {
    if (!imageUrl) return null;
    
    const url = new URL('/api/download', window.location.origin);
    url.searchParams.set('imageUrl', imageUrl);
    url.searchParams.set('intensity', intensity.toString());
    url.searchParams.set('color', selectedColor);
    url.searchParams.set('preview', 'true');
    url.searchParams.set('t', Date.now().toString()); // Cache busting
    
    return url.toString();
  };

  // Update processed image when parameters change
  useEffect(() => {
    if (originalImageUrl) {
      setIsLoading(true);
      setProcessedImageUrl(generateProcessedImageUrl(originalImageUrl));
    }
  }, [intensity, selectedColor, originalImageUrl]);

  const addFrame = async () => {
    if (typeof window === 'undefined') return;
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      } else if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      } else {
        setAddFrameResult(`Error: ${String(error)}`);
      }
    }
  };

  // Initialize SDK and load profile image
  useEffect(() => {
    if (typeof window === 'undefined' || isSDKLoaded) return;

    const loadFallbackProfileImage = () => {
      const fallbackImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZTRlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI2ZiZDVkYiIvPjxyZWN0IHg9IjY1IiB5PSIxNDAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIzMCIgcng9IjE1IiBmaWxsPSIjZmJkNWRiIi8+PHRleHQgeD0iNTAlIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2VjNDg5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGlua2lmeSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==';
      setOriginalImageUrl(fallbackImageUrl);
      setProcessedImageUrl(generateProcessedImageUrl(fallbackImageUrl));
      setIsLoading(false);
    };

    const initializeSDK = async () => {
      try {
        setIsSDKLoaded(true);
        
        // Get frame context from SDK
        const frameContext = await sdk?.context as FrameContext;
        if (!frameContext) {
          console.error("No frame context available");
          loadFallbackProfileImage();
          return;
        }

        setContext(frameContext);
        setAdded(frameContext.client.added);

        const imageUrl = frameContext.user?.pfpUrl || null;
        if (!imageUrl) {
          console.log("No valid profile image found in frame context");
          loadFallbackProfileImage();
          return;
        }

        // Validate URL format
        try {
          new URL(imageUrl);
          setOriginalImageUrl(imageUrl);
          setProcessedImageUrl(generateProcessedImageUrl(imageUrl));
          
          // If frame isn't already added, prompt user to add it
          if (!frameContext.client.added) {
            addFrame();
          }
        } catch (e) {
          console.error("Invalid URL format:", imageUrl);
          loadFallbackProfileImage();
        }

        // Set up event listeners
        sdk.on("frameAdded", () => setAdded(true));
        sdk.on("frameRemoved", () => setAdded(false));

        // Signal to the Frame SDK that we're ready to display content
        sdk.actions.ready();
      } catch (error) {
        console.error("Error initializing Frame SDK:", error);
        loadFallbackProfileImage();
      }
    };

    initializeSDK();

    return () => {
      sdk.removeAllListeners();
    };
  }, [isSDKLoaded]);

  // Sync with localStorage and URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // First check URL parameters (highest priority)
      const params = new URLSearchParams(window.location.search);
      const intensityParam = params.get('intensity');

      if (intensityParam) {
        const intensityValue = parseInt(intensityParam, 10);
        if (!isNaN(intensityValue) && intensityValue >= 0 && intensityValue <= 100) {
          setIntensity(intensityValue);
          localStorage.setItem('pinkify-intensity', intensityValue.toString());
          return; // URL param takes precedence
        }
      }

      // Then check localStorage if no valid URL param
      const savedIntensity = localStorage.getItem('pinkify-intensity');
      if (savedIntensity) {
        const savedValue = parseInt(savedIntensity, 10);
        if (!isNaN(savedValue) && savedValue >= 0 && savedValue <= 100) {
          setIntensity(savedValue);
        }
      }
    } catch (error) {
      console.error("Error syncing intensity value:", error);
      setIntensity(50);
    }
  }, []);

  // Save to localStorage when intensity changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('pinkify-intensity', intensity.toString());
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [intensity]);

  if (typeof window === 'undefined') {
    return null; // Return null during SSR
  }

  return (
    <div
      className="grid h-screen grid-rows-[auto_1fr] gap-4 overflow-y-hidden"
      style={{
        // @ts-expect-error any
        paddingTop: context?.client?.safeAreaInsets?.top ?? 0,
        // @ts-expect-error any
        paddingBottom: context?.client?.safeAreaInsets?.bottom ?? 0,
        // @ts-expect-error any
        paddingLeft: context?.client?.safeAreaInsets?.left ?? 0,
        // @ts-expect-error any
        paddingRight: context?.client?.safeAreaInsets?.right ?? 0,
        height: '100dvh',
        maxHeight: '100dvh'
      }}
    >
      <main className="grid place-items-center px-4 py-4 md:py-8">
        <div className="w-full max-w-[512px] mx-auto relative">
          {/* Image display area */}
          <div className="relative">
            {processedImageUrl ? (
              <div className="relative aspect-square">
                <img
                  src={processedImageUrl}
                  alt={`${selectedColor}ified profile`}
                  className="w-full h-auto max-h-[512px] aspect-square bg-neutral-100 rounded-lg shadow-sm"
                  style={{
                    maxWidth: 'min(90vw, 512px)',
                    maxHeight: 'min(90vh, 512px)',
                    width: 'min(90vw, min(90vh, 512px))',
                    height: 'min(90vw, min(90vh, 512px))'
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>
            ) : (
              <div 
                className="w-full h-auto max-h-[512px] aspect-square bg-neutral-100 rounded-lg shadow-sm flex items-center justify-center"
                style={{
                  maxWidth: 'min(90vw, 512px)',
                  maxHeight: 'min(90vh, 512px)',
                  width: 'min(90vw, min(90vh, 512px))',
                  height: 'min(90vw, min(90vh, 512px))'
                }}
              >
                <div className="text-gray-400">Loading image...</div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm transition-all duration-300">
                <div className="flex flex-col items-center p-4 bg-white/80 rounded-xl shadow-lg">
                  <div className="relative w-12 h-12 mb-3">
                    <svg className="animate-spin h-12 w-12 text-pink-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-pink-700">Processing image...</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Applying {selectedColor.toLowerCase()} filter at {intensity}% intensity
                  </div>
                </div>
              </div>
            )}

            {/* Animation styles */}
            <style jsx global>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.3s ease-out forwards;
              }
              @keyframes pulse {
                0% { transform: scale(0.95); opacity: 0.7; }
                50% { transform: scale(1.05); opacity: 0.9; }
                100% { transform: scale(0.95); opacity: 0.7; }
              }
              .animate-pulse {
                animation: pulse 1.5s infinite;
              }
            `}</style>
          </div>

          {/* Controls section */}
          <div className="mt-4 flex flex-col gap-3 w-full max-w-[512px]">
            {/* Responsive layout styles */}
            <style jsx global>{`
              @media screen and (max-width: 428px) {
                .slider-container {
                  flex-direction: column;
                  align-items: flex-start;
                }
                .slider-value {
                  margin-left: auto;
                }
              }
              @media screen and (max-height: 428px) and (orientation: landscape) {
                .controls-container {
                  flex-direction: row;
                  align-items: center;
                  justify-content: space-between;
                }
              }
              @media screen and (min-width: 768px) {
                .slider-container {
                  max-width: 80%;
                  margin: 0 auto;
                }
              }
            `}</style>

            {/* Intensity slider */}
            <div className="flex items-center gap-2 slider-container" data-testid="intensity-slider">
              <span className="text-left flex text-xl font-medium min-w-16">{selectedColor} intensifies</span>
              <div className="relative w-full">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value, 10);
                    setIntensity(newValue);
                  }}
                  className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${COLOR_MAP[selectedColor]} ${intensity}%, #f3f4f6 ${intensity}%)`,
                    touchAction: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>
              <span className="text-md min-w-8 slider-value">{intensity}%</span>
            </div>

            {/* Color selection */}
            <div className="mt-4">
              <h2 className="text-xl font-medium mb-2">Pick Tribe</h2>
              <ColorSelect 
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            </div>

            {/* Download button */}
            <div className="controls-container" data-testid="download-container">
              <button
                data-testid="download-button"
                onClick={() => {
                  if (!processedImageUrl) return;
                  
                  try {
                    // Create download URL with download parameter
                    const downloadUrl = new URL(processedImageUrl);
                    downloadUrl.searchParams.delete('preview');
                    downloadUrl.searchParams.set('download', 'true');
                    
                    // Use Frame SDK to open URL for download
                    sdk.actions.openUrl(downloadUrl.toString());
                    
                    // Show success toast
                    const toast = document.createElement('div');
                    toast.textContent = 'Image downloaded!';
                    toast.style.position = 'fixed';
                    toast.style.bottom = '20px';
                    toast.style.left = '50%';
                    toast.style.transform = 'translateX(-50%) translateY(20px)';
                    toast.style.backgroundColor = '#ec4899';
                    toast.style.color = 'white';
                    toast.style.padding = '10px 20px';
                    toast.style.borderRadius = '8px';
                    toast.style.zIndex = '1000';
                    toast.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
                    toast.style.fontWeight = '600';
                    toast.style.fontSize = '14px';
                    toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    toast.style.opacity = '0';
                    toast.style.display = 'flex';
                    toast.style.alignItems = 'center';
                    toast.style.gap = '8px';

                    // Add success icon to toast
                    const checkIcon = document.createElement('span');
                    checkIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    toast.insertBefore(checkIcon, toast.firstChild);

                    document.body.appendChild(toast);

                    // Animate toast in
                    requestAnimationFrame(() => {
                      toast.style.opacity = '1';
                      toast.style.transform = 'translateX(-50%) translateY(0)';
                    });

                    // Animate toast out
                    setTimeout(() => {
                      toast.style.opacity = '0';
                      toast.style.transform = 'translateX(-50%) translateY(-20px)';
                      setTimeout(() => {
                        if (document.body.contains(toast)) {
                          document.body.removeChild(toast);
                        }
                      }, 300);
                    }, 2000);

                    // Track analytics if available
                    try {
                      if (typeof window !== 'undefined' && 'posthog' in window) {
                        const posthog = (window as any).posthog;
                        if (posthog && typeof posthog.capture === 'function') {
                          posthog.capture('download_image', {
                            intensity: intensity,
                            color: selectedColor,
                            platform: 'farcaster_frame'
                          });
                        }
                      }
                    } catch (analyticsError) {
                      console.error('Analytics error:', analyticsError);
                    }
                  } catch (error) {
                    console.error('Error downloading image:', error);
                    
                    // Show error toast
                    const errorToast = document.createElement('div');
                    errorToast.textContent = 'Download failed. Try again.';
                    errorToast.style.position = 'fixed';
                    errorToast.style.bottom = '20px';
                    errorToast.style.left = '50%';
                    errorToast.style.transform = 'translateX(-50%) translateY(20px)';
                    errorToast.style.backgroundColor = '#ef4444';
                    errorToast.style.color = 'white';
                    errorToast.style.padding = '10px 20px';
                    errorToast.style.borderRadius = '8px';
                    errorToast.style.zIndex = '1000';
                    errorToast.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                    errorToast.style.fontWeight = '600';
                    errorToast.style.fontSize = '14px';
                    errorToast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    errorToast.style.opacity = '0';
                    errorToast.style.display = 'flex';
                    errorToast.style.alignItems = 'center';
                    errorToast.style.gap = '8px';

                    const errorIcon = document.createElement('span');
                    errorIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                    errorToast.insertBefore(errorIcon, errorToast.firstChild);

                    document.body.appendChild(errorToast);
                    
                    requestAnimationFrame(() => {
                      errorToast.style.opacity = '1';
                      errorToast.style.transform = 'translateX(-50%) translateY(0)';
                    });
                    
                    setTimeout(() => {
                      errorToast.style.opacity = '0';
                      errorToast.style.transform = 'translateX(-50%) translateY(-20px)';
                      setTimeout(() => {
                        if (document.body.contains(errorToast)) {
                          document.body.removeChild(errorToast);
                        }
                      }, 300);
                    }, 2000);
                  }
                }}
                disabled={!processedImageUrl || isLoading}
                className="mt-2 px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 active:bg-pink-700 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                aria-label={`Download ${selectedColor.toLowerCase()}ified profile image`}
              >
                {isLoading ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
