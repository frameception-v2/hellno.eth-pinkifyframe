"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import sdk, {
  AddFrame,
} from "@farcaster/frame-sdk";
import { PROJECT_TITLE } from "~/lib/constants";
import type { FrameContext } from "@farcaster/frame-node";

export default function Frame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | undefined>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(69); // Default intensity
  const [imageLoaded, setImageLoaded] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [addFrameResult, setAddFrameResult] = useState("");

  // Function to apply pink filter to the image
  const applyPinkFilter = useCallback((img: HTMLImageElement, intensity: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    console.log('applyPinkFilter canvas', canvas, 'ctx', ctx);
    if (!ctx) return;

    console.log('Applying pink filter with intensity:', intensity);
    
    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Always draw original image first
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Apply pink overlay with full coverage at 100%
      if (intensity === 100) {
        ctx.fillStyle = '#ff69b4'; // Solid hot pink
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const alpha = intensity / 100;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(255, 105, 180, ${alpha * 1.5})`; // Stronger pink color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    } catch (error) {
      console.error('Error applying filter:', error);
      // If filter fails, just draw the original image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    setImageLoaded(true);
  }, [canvasRef]);
  
  // Setup canvas context and resize observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
    }

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
          sliderElement.removeEventListener('touchstart', emptyHandler);
          sliderElement.removeEventListener('touchmove', emptyHandler);
        }
      };
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Load and process profile image when URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('profileImage:', profileImage);
    console.log('canvasRef:', canvasRef.current);
    if (!profileImage || !canvasRef.current) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Successfully loaded profile image from:', profileImage);
      console.log('Image dimensions:', img.width, 'x', img.height);
      applyPinkFilter(img, intensity);
    };
    
    img.onerror = () => {
      console.error('Error loading image from:', profileImage);
      console.log('Attempting fallback loading strategies...');
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
  }, [profileImage, applyPinkFilter, intensity]);
  
  // Update filter when intensity changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!profileImage || !imageLoaded) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      applyPinkFilter(img, intensity);
    };
    
    img.src = profileImage;
  }, [intensity, applyPinkFilter, profileImage, imageLoaded]);

  const addFrame = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadFallbackProfileImage = () => {
      const fallbackImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZTRlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI1MCIgZmlsbD0iI2ZiZDVkYiIvPjxyZWN0IHg9IjY1IiB5PSIxNDAiIHdpZHRoPSI3MCIgaGVpZ2h0PSIzMCIgcng9IjE1IiBmaWxsPSIjZmJkNWRiIi8+PHRleHQgeD0iNTAlIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2VjNDg5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGlua2lmeSBQcm9maWxlPC90ZXh0Pjwvc3ZnPg==';
      setProfileImage(fallbackImageUrl);
      console.log("Using fallback profile image");
    };

    const load = async () => {
      try {
        // Get frame context from SDK
        const frameContext = await sdk?.context as FrameContext;
        if (!frameContext) {
          console.error("No frame context available");
          // Load fallback image if no context is available
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
        
        console.log('Profile image URL:', imageUrl);
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
        
        setProfileImage(imageUrl);

        // If frame isn't already added, prompt user to add it
        if (!frameContext.client.added) {
          addFrame();
        }

        // Set up event listeners with proper type safety
        sdk.on("frameAdded", () => {
          setAdded(true);
        });

        sdk.on("frameRemoved", () => {
          setAdded(false);
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
    if (typeof window === 'undefined') return;
    
    // This ensures the code only runs on the client side
    const syncIntensity = () => {
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
      } catch (error)  {
        console.error("Error syncing intensity value:", error);
        // Fallback to default value if there's an error
        setIntensity(50);
      }
    };

    // Only run in browser environment
    syncIntensity();
    
    // Add responsive testing listener for development
    if (process.env.NODE_ENV ===  'development') {
      const updateDimensions = () => {
        const dimensionDisplay = document.getElementById('responsive-dimensions');
        if (dimensionDisplay) {
          dimensionDisplay.textContent = `${window.innerWidth}×${window.innerHeight}`;
        }
      };
      
      window.addEventListener('resize', updateDimensions);
      updateDimensions(); // Initial call
      
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, []);
  
  // Sync to localStorage whenever intensity changes
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

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm transition-all duration-300">
                  <div className="flex flex-col items-center p-4 bg-white/80 rounded-xl shadow-lg animate-fadeIn">
                    <div className="relative w-12 h-12 mb-3">
                      <svg className="animate-spin absolute inset-0 h-12 w-12 text-pink-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full bg-pink-500 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-pink-700">Loading your image...</div>
                    <div className="text-xs text-gray-500 mt-1 animate-pulse">
                      {profileImage ? "Processing image..." : "Initializing frame..."}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 max-w-[200px] text-center">
                      {profileImage ? 
                        "Applying pink filter to your profile picture" : 
                        "Open in Farcaster to pinkify your profile image"}
                    </div>
                  </div>
                </div>
              )}
              
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
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                  background: linear-gradient(90deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 75%);
                  background-size: 200% 100%;
                  animation: shimmer 2s infinite;
                }
              `}</style>
            </div>
            
            {profileImage && imageLoaded && (
              <div className="mt-2 text-sm text-center text-gray-500 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Profile image loaded successfully</span>
              </div>
            )}
            
            {!profileImage && isSDKLoaded && (
              <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-700">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-pink-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <p className="font-medium">Waiting for profile image</p>
                    <p className="mt-1 text-xs text-pink-600">
                      Make sure you&apos;re viewing this frame from a Farcaster client that provides profile data
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!isSDKLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                <div className="text-lg font-medium">Initializing Frame SDK...</div>
              </div>
            )}
              
            {/* Responsive testing overlay - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-2 right-2 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded-md flex flex-col items-end">
                <div className="sm:hidden">XS: Mobile (xs)</div>
                <div className="hidden sm:block md:hidden">SM: Small (sm)</div>
                <div className="hidden md:block lg:hidden">MD: Medium (md)</div>
                <div className="hidden lg:block xl:hidden">LG: Large (lg)</div>
                <div className="hidden xl:block 2xl:hidden">XL: Extra Large (xl)</div>
                <div className="hidden 2xl:block">2XL: Extra Extra Large (2xl)</div>
                <div className="mt-1 text-[10px] opacity-70">
                  <span className="portrait:inline landscape:hidden">Portrait</span>
                  <span className="portrait:hidden landscape:inline">Landscape</span>
                  <span className="ml-1">
                    {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : ''}
                  </span>
                </div>
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
                
                /* Additional responsive breakpoints for testing */
                @media screen and (min-width: 640px) {
                  .sm-indicator { display: block; }
                }
                
                @media screen and (min-width: 768px) {
                  .md-indicator { display: block; }
                }
                
                @media screen and (min-width: 1024px) {
                  .lg-indicator { display: block; }
                }
                
                @media screen and (min-width: 1280px) {
                  .xl-indicator { display: block; }
                }
                
                @media screen and (min-width: 1536px) {
                  .xxl-indicator { display: block; }
                }
                
                /* Orientation-specific styles */
                @media screen and (orientation: portrait) {
                  .portrait-indicator { display: inline; }
                  .landscape-indicator { display: none; }
                }
                
                @media screen and (orientation: landscape) {
                  .portrait-indicator { display: none; }
                  .landscape-indicator { display: inline; }
                }
              `}</style>
              <div className="flex items-center gap-2 slider-container" data-testid="intensity-slider">
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
                 
                </div>
                <span className="text-sm min-w-8 slider-value">{intensity}%</span>
              </div>
              
              <div className="controls-container" data-testid="download-container">
                <button
                  data-testid="download-button"
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
                      
                      // Show animated feedback toast for mobile users
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
                      toast.style.transition =  'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
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
                      
                      // Track download in analytics if available
                      try {
                        if (typeof window !== 'undefined' && 'posthog' in window) {
                          // Use proper TypeScript declaration for window.posthog
                          const posthog = (window as any).posthog;
                          if (posthog && typeof posthog.capture === 'function') {
                            posthog.capture('download_image', { 
                              intensity: intensity,
                              platform: 'farcaster_frame'
                            });
                          }
                        }
                      } catch (analyticsError) {
                        console.error('Analytics error:', analyticsError);
                        // Don't let analytics errors break the download functionality
                      }
                      
                    } catch (error) {
                      console.error('Error downloading image:', error);
                      
                      // Show animated error toast
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
                      
                      // Add error icon to toast
                      const errorIcon = document.createElement('span');
                      errorIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                      errorToast.insertBefore(errorIcon, errorToast.firstChild);
                      
                      document.body.appendChild(errorToast);
                      
                      // Animate error toast in
                      requestAnimationFrame(() => {
                        errorToast.style.opacity = '1';
                        errorToast.style.transform = 'translateX(-50%) translateY(0)';
                      });
                      
                      // Animate error toast out with shake effect
                      setTimeout(() => {
                        errorToast.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
                        errorToast.style.transform = 'translateX(-50%) translateY(0)';
                        
                        // Add shake keyframes
                        const style = document.createElement('style');
                        style.innerHTML = `
                          @keyframes shake {
                            10%, 90% { transform: translateX(-51%) translateY(0); }
                            20%, 80% { transform: translateX(-49%) translateY(0); }
                            30%, 50%, 70% { transform: translateX(-52%) translateY(0); }
                            40%, 60% { transform: translateX(-48%) translateY(0); }
                          }
                        `;
                        document.head.appendChild(style);
                        
                        setTimeout(() => {
                          errorToast.style.opacity = '0';
                          errorToast.style.transform = 'translateX(-50%) translateY(-20px)';
                          setTimeout(() => {
                            if (document.body.contains(errorToast)) {
                              document.body.removeChild(errorToast);
                            }
                            if (document.head.contains(style)) {
                              document.head.removeChild(style);
                            }
                          }, 300);
                        }, 1000);
                      }, 2000);
                      
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
                  className="mt-2 px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 active:bg-pink-700 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
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
