import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { COLOR_MAP, ColorName } from '@/lib/colors';

export function ColorSelect({
  selectedColor,
  onColorChange,
}: {
  selectedColor: ColorName;
  onColorChange: (color: ColorName) => void;
}) {
  return (
    <Select value={selectedColor} onValueChange={onColorChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select color" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(COLOR_MAP).map(([name, hex]) => (
          <SelectItem key={name} value={name}>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: hex }}
              />
              <span>{name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
