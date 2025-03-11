interface Window {
  posthog?: {
    capture: (event: string, properties?: Record<string, any>) => void;
    identify: (id: string, properties?: Record<string, any>) => void;
    reset: () => void;
    [key: string]: any;
  };
}
