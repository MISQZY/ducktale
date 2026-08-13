interface ColorPickerFieldProps {
  color: string;
  setColor: (color: string) => void;
  label: string;
}

export function ColorPickerField({ color, setColor, label }: ColorPickerFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="color" className="text-xs uppercase tracking-widest text-foreground/50">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id="color"
          name="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded-md border border-[var(--color-input-border)] bg-transparent cursor-pointer p-0.5"
        />
        <span className="text-xs text-foreground/50 font-mono">{color}</span>
      </div>
    </div>
  );
}
