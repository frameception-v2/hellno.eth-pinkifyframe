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

export const getButtonClassnameForColor = (color: string): string => {
  console.log('getButtonClassnameForColor color', color);

  // ai! use hex color_map instead of tailwind color
  switch (color) {
    case 'Pink':
      return 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700';
    case 'Blue':
      return 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700';
    case 'Silver':
      return 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700';
    case 'Green':
      return 'bg-green-500 hover:bg-green-600 active:bg-green-700';
    case 'Gold':
      return 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700';
    case 'Aqua':
      return 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
    case 'Red':
      return 'bg-red-500 hover:bg-red-600 active:bg-red-700';
    case 'Yellow':
      return 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700';
    case 'Purple':
      return 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700';
    default:
      return '';
  }
};
