export const COLOR_MAP = {
  Pink: '#FF69B4',
  Blue: '#0000FF',
  Silver: '#C0C0C0', 
  Green: '#008000',
  Gold: '#FFD700',
  Resurrection: '#1A1A1A', // Assuming resurrection is a dark color
  Aqua: '#00FFFF',
  Red: '#FF0000',
  Yellow: '#FFFF00',
  Purple: '#800080'
} as const;

export type ColorName = keyof typeof COLOR_MAP;
