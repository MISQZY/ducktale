import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { cn } from "@/lib/utils";

interface ColorPickerFieldProps {
  color: string;
  setColor: (color: string) => void;
  label: string;
}

const PRESET_COLORS = [
  "#d4a017", // Primary gold
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#64748b", // Slate
];

export function ColorPickerField({ color, setColor, label }: ColorPickerFieldProps) {
  return (
    <FormField id="color" label={label}>
      <input type="hidden" name="color" value={color} />
      
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
            style={formInputStyle}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="h-4 w-4 rounded-full border border-foreground/20 shadow-sm" 
                style={{ backgroundColor: color }} 
              />
              <span className="font-mono text-sm">{color}</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-3 rounded-xl liquid-card border-primary/20" align="start">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 font-mono text-xs uppercase"
              />
              <label 
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-foreground/20 shadow-sm transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: color }}
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
            
            <div className="grid grid-cols-6 gap-2 pt-1">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  title={preset}
                  onClick={() => setColor(preset)}
                  className={cn(
                    "h-6 w-6 rounded-full border shadow-sm transition-transform hover:scale-110 focus:outline-none",
                    color.toLowerCase() === preset.toLowerCase() 
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent" 
                      : "border-foreground/20"
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
