"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, {
  AddFrame,
  type FrameContext,
} from "@farcaster/frame-sdk";
import { PROJECT_TITLE } from "~/lib/constants";

export default function Frame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context2d, setContext2d] = useState<CanvasRenderingContext2D | null>(null);
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

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    
    // Set up passive touch event listeners for better mobile performance
    const sliderElement = document.querySelector('input[type="range"]');
    if (sliderElement) {
      const options = { passive: true };
      const emptyHandler = () => {};
      sliderElement.addEventListener('touchstart', emptyHandler, options);
      sliderElement.addEventListener('touchmove', emptyHandler, options);
      
      return () => {
        resizeObserver.disconnect();
        if (sliderElement) {
          sliderElement.removeEventListener('touchstart', emptyHandler, options);
          sliderElement.removeEventListener('touchmove', emptyHandler, options);
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
    
    img.onerror = () => {
      console.error('Error loading image');
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
      } else if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      } else {
        setAddFrameResult(`Error: ${String(error)}`);
      }
    }
  }, []);

  useEffect(() => {
    const loadFallbackProfileImage = () => {
      const fallbackImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZTRlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI2ZiZDVkYiIvPjxyZWN0IHg9IjY1IiB5PSIxNDAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIzMCIgcng9IjE1IiBmaWxsPSIjZmJkNWRiIi8+PHRleHQgeD0iNTAlIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2VjNDg5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGlua2lmeSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==';
      setProfileImage(fallbackImageUrl);
      console.log("Using fallback profile image");
    };

    const load = async () => {
      try {
        // Get frame context from SDK
        const frameContext = await sdk?.context;
        if (!frameContext) {
          console.error("No frame context available");
          // Load fallback image if no context is available
          loadFallbackProfileImage();
          return;
        }

        setContext(frameContext);
        setAdded(frameContext.client.added);

        // Extract profile image URL from frame context if available
        let imageUrl = null;
        
        // Validate frame context data with proper type checking
        if (frameContext.user) {
          if (frameContext.user.pfp) {
            if (typeof frameContext.user.pfp === 'object') {
              if ('url' in frameContext.user.pfp && typeof frameContext.user.pfp.url === 'string') {
                imageUrl = frameContext.user.pfp.url;
                console.log("Profile image URL:", imageUrl);
              } else if ('oembedPhotoData' in frameContext.user.pfp && 
                         frameContext.user.pfp.oembedPhotoData && 
                         typeof frameContext.user.pfp.oembedPhotoData === 'object') {
                // Handle oembed photo data format
                const oembedData = frameContext.user.pfp.oembedPhotoData;
                if ('url' in oembedData && typeof oembedData.url === 'string') {
                  imageUrl = oembedData.url;
                  console.log("Profile image from oembed:", imageUrl);
                }
              }
            }
          }
        }
        
        if (!imageUrl) {
          console.log("No valid profile image found in frame context");
          loadFallbackProfileImage();
          return;
        }
        
        // Validate URL format
        let isValidUrl = false;
        try {
          new URL(imageUrl);
          isValidUrl = true;
        } catch (e) {
          console.error("Invalid URL format:", imageUrl);
        }
        
        if (!isValidUrl) {
          console.error("Invalid image URL format");
          loadFallbackProfileImage();
          return;
        }
        
        // Apply CORS proxy if needed for cross-origin images
        try {
          const urlObj = new URL(imageUrl);
          const isExternalDomain = urlObj.origin !== window.location.origin;
          
          if (isExternalDomain) {
            // Use a CORS proxy for external images
            const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
            setProfileImage(corsProxyUrl);
            console.log("Using CORS proxy for image:", corsProxyUrl);
          } else {
            setProfileImage(imageUrl);
          }
        } catch (error) {
          console.error("Error processing image URL:", error);
          loadFallbackProfileImage();
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
        sdk.actions.ready();
      } catch (error) {
        console.error("Error initializing Frame SDK:", error);
        loadFallbackProfileImage();
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

  // Sync with localStorage and URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check URL parameters (highest priority)
        const params = new URLSearchParams(window.location.search);
        const intensityParam = params.get('intensity');
        
        if (intensityParam) {
          const intensityValue = parseInt(intensityParam, 10);
          if (!isNaN(intensityValue) && intensityValue >= 0 && intensityValue <= 100) {
            setIntensity(intensityValue);
            localStorage.setItem('pinkify-intensity', intensityValue.toString());
            console.log(`Intensity set from URL: ${intensityValue}%`);
            return; // URL param takes precedence
          }
        }
        
        // Then check localStorage if no valid URL param
        const savedIntensity = localStorage.getItem('pinkify-intensity');
        if (savedIntensity) {
          const savedValue = parseInt(savedIntensity, 10);
          if (!isNaN(savedValue) && savedValue >= 0 && savedValue <= 100) {
            setIntensity(savedValue);
            console.log(`Intensity restored from localStorage: ${savedValue}%`);
          }
        }
      } catch (error) {
        console.error("Error syncing intensity value:", error);
        // Fallback to default value if there's an error
        setIntensity(50);
      }
    }
  }, []);
  
  // Sync to localStorage whenever intensity changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pinkify-intensity', intensity.toString());
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [intensity]);

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
          height: '100dvh', // Use dynamic viewport height
          maxHeight: '100dvh' // Ensure content doesn't overflow
        }}
      >
        <main className="grid place-items-center px-4 py-4 md:py-8">
          <div className="w-full max-w-[512px] mx-auto relative">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[512px] aspect-square bg-neutral-100 rounded-lg shadow-sm"
                style={{
                  maxWidth: 'min(90vw, 512px)',
                  maxHeight: 'min(90vh, 512px)',
                  // Adjust canvas size based on aspect ratio
                  width: 'min(90vw, min(90vh, 512px))',
                  height: 'min(90vw, min(90vh, 512px))'
                }}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-pink-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-sm font-medium">Loading image...</div>
                  </div>
                </div>
              )}
            </div>
            
            {profileImage && (
              <div className="mt-2 text-sm text-center text-gray-500">
                {imageLoaded 
                  ? "Profile image loaded successfully" 
                  : "Loading profile image..."}
              </div>
            )}
            
            {!isSDKLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                <div className="text-lg font-medium">Initializing Frame SDK...</div>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 w-full max-w-[512px]">
              {/* Add responsive layout styles */}
              <style jsx global>{`
                /* Portrait phones */
                @media screen and (max-width: 428px) {
                  .slider-container {
                    flex-direction: column;
                    align-items: flex-start;
                  }
                  .slider-value {
                    margin-left: auto;
                  }
                }
                
                /* Landscape phones */
                @media screen and (max-height: 428px) and (orientation: landscape) {
                  .canvas-container {
                    max-height: 70vh;
                  }
                  .controls-container {
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                  }
                }
                
                /* Tablets and larger */
                @media screen and (min-width: 768px) {
                  .slider-container {
                    max-width: 80%;
                    margin: 0 auto;
                  }
                }
              `}</style>
              <div className="flex items-center gap-2 slider-container">
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
                      // localStorage sync is now handled by the dedicated useEffect
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                <span className="text-sm min-w-8 slider-value">{intensity}%</span>
              </div>
              
              <div className="controls-container">
                <button
                  onClick={() => {
                    if (!canvasRef.current || !imageLoaded) return;
                    
                    try {
                      // Create a high-quality PNG with proper filename
                      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                      const filename = `pinkified-profile-${timestamp}.png`;
                      
                      // Get canvas data with maximum quality
                      const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
                      
                      // Create and trigger download
                      const link = document.createElement('a');
                      link.download = filename;
                      link.href = dataUrl;
                      link.rel = 'noopener noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      
                      // Clean up
                      setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(dataUrl);
                      }, 100);
                      
                      // Show feedback toast for mobile users
                      const toast = document.createElement('div');
                      toast.textContent = 'Image downloaded!';
                      toast.style.position = 'fixed';
                      toast.style.bottom = '20px';
                      toast.style.left = '50%';
                      toast.style.transform = 'translateX(-50%)';
                      toast.style.backgroundColor = '#ec4899';
                      toast.style.color = 'white';
                      toast.style.padding = '8px 16px';
                      toast.style.borderRadius = '4px';
                      toast.style.zIndex = '1000';
                      toast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                      toast.style.fontWeight = '500';
                      toast.style.fontSize = '14px';
                      toast.style.transition = 'opacity 0.3s ease-in-out';
                      document.body.appendChild(toast);
                      
                      // Animate toast
                      setTimeout(() => {
                        toast.style.opacity = '0';
                        setTimeout(() => {
                          if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                          }
                        }, 300);
                      }, 2000);
                      
                      // Track download in analytics if available
                      if (typeof window !== 'undefined' && 'posthog' in window && window.posthog) {
                        // @ts-ignore - PostHog might not be typed
                        window.posthog.capture('download_image', { 
                          intensity: intensity,
                          platform: 'farcaster_frame'
                        });
                      }
                      
                    } catch (error) {
                      console.error('Error downloading image:', error);
                      
                      // Show error toast
                      const errorToast = document.createElement('div');
                      errorToast.textContent = 'Download failed. Try again.';
                      errorToast.style.position = 'fixed';
                      errorToast.style.bottom = '20px';
                      errorToast.style.left = '50%';
                      errorToast.style.transform = 'translateX(-50%)';
                      errorToast.style.backgroundColor = '#ef4444';
                      errorToast.style.color = 'white';
                      errorToast.style.padding = '8px 16px';
                      errorToast.style.borderRadius = '4px';
                      errorToast.style.zIndex = '1000';
                      errorToast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                      document.body.appendChild(errorToast);
                      
                      setTimeout(() => {
                        if (document.body.contains(errorToast)) {
                          document.body.removeChild(errorToast);
                        }
                      }, 3000);
                      
                      // Try alternative download method for mobile
                      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                        try {
                          // Open image in new tab as fallback
                          window.open(canvasRef.current.toDataURL('image/png'), '_blank');
                        } catch (e) {
                          console.error('Fallback download failed:', e);
                        }
                      }
                    }
                  }}
                  disabled={!imageLoaded}
                  className="mt-2 px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 active:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  aria-label="Download pinkified profile image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
