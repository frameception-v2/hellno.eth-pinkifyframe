```markdown
# Pinkify Profile Picture Frame Specification

## 1. OVERVIEW

### Core Functionality
- Dynamic profile picture (pfp) processing using Frame Context API
- Real-time pink colorization with adjustable intensity slider
- Client-side image manipulation canvas
- One-click PNG download capability
- Mobile-first interactive experience

### UX Flow
1. Frame loads user's pfp from frame context metadata
2. Display original image with semi-transparent pink overlay
3. Interactive slider controls color intensity (0-100%)
4. Real-time preview updates as slider changes
5. Download button triggers PNG export
6. Right-click save alternative for desktop users

## 2. TECHNICAL REQUIREMENTS

### Responsive Design
- Canvas element scales proportionally to viewport (max 90vw/90vh)
- Flex layout for slider + button controls
- Dynamic viewport units (vw/vh) for mobile consistency
- CSS media queries for aspect ratio adaptation

### Data Handling
- Frame Context API for pfp URL retrieval (OembedPhotoData schema)
- Client-side image processing only
- Temporary state storage in localStorage for slider position

## 3. FRAMES v2 IMPLEMENTATION

### Interactive Elements
- HTML5 Canvas for image composition
- RGB(A) manipulation via 2D context
- Custom <input type="range"> slider with thumb styling
- Dynamic meta tag updates for frame state preservation

### Input Handling
- Pointer/touch events for slider interaction
- Download button uses standard anchor download attribute
- Frame state serialization preserves intensity value

### Media Output
- Canvas.toDataURL() for PNG generation
- Data URI conversion for instant download
- Frame SDK share capabilities as fallback

## 4. MOBILE CONSIDERATIONS

### Responsive Techniques
- Touch-optimized slider (minimum 48px hit area)
- Viewport-aware scaling (image never exceeds 512px²)
- CSS Grid for control layout stacking
- Prevent vertical overflow (overflow-y: hidden)

### Touch Patterns
- Passive event listeners for slider performance
- Visual feedback on thumb drag
- Download confirmation toast
- Viewport meta tags for mobile scaling

## 5. CONSTRAINTS COMPLIANCE

### System Limitations
- No cross-device sync (localStorage isolation)
- Ephemeral storage (no user accounts/persistence)
- Pure client-side implementation (no backend)
- Vanilla JS + Frame SDK only

### Scope Management
- Single HTML document architecture
- No authentication requirements
- No blockchain interactions
- No external API dependencies
- Progressive enhancement baseline

### Prototype Priorities
- Focus core colorization algorithm
- Basic error handling for image loading
- Graceful degradation for unsupported browsers
- Minimal state management
- No cross-browser polyfills
```

This specification focuses on leveraging Frame v2 capabilities while maintaining strict compliance with the provided technical context and user requirements. The design prioritizes mobile usability and client-side processing within the documented constraints.