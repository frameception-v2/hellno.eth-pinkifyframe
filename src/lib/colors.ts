export const COLOR_MAP = {
  Pink: '#FF69B4',
  Blue: '#0000FF',
  Silver: '#C0C0C0', 
  Green: '#008000',
  Gold: '#FFD700',
  Aqua: '#00FFFF',
  Red: '#FF0000',
  Yellow: '#FFFF00',
  Purple: '#800080'
} as const;

export type ColorName = keyof typeof COLOR_MAP;

// Helper function to darken a hex color
const darkenColor = (hex: string, percent: number): string => {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Darken each component
  const darkenedR = Math.max(0, Math.floor(r * (1 - percent / 100)));
  const darkenedG = Math.max(0, Math.floor(g * (1 - percent / 100)));
  const darkenedB = Math.max(0, Math.floor(b * (1 - percent / 100)));
  
  // Convert back to hex
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
};

export const getButtonClassnameForColor = (color: string): string => {
  console.log('getButtonClassnameForColor color', color);

  // Get the base color from COLOR_MAP
  const baseColor = COLOR_MAP[color as ColorName] || COLOR_MAP.Pink;
  
  // Create hover and active colors (20% and 40% darker)
  const hoverColor = darkenColor(baseColor, 20);
  const activeColor = darkenColor(baseColor, 40);
  
  // Return tailwind classes with the specific colors
  return `bg-[${baseColor}] hover:bg-[${hoverColor}] active:bg-[${activeColor}] text-white font-medium`;
};
