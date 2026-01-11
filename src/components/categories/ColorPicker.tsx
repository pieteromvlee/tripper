import { useState } from "react";
import { Check } from "lucide-react";
import { PRESET_COLORS, isValidHexColor } from "../../lib/colorUtils";
import { CategoryIcon } from "../../lib/typeIcons";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  usedColors?: Map<string, Array<{ iconName: string; name: string }>>;
}

export function ColorPicker({ value, onChange, className = "", usedColors }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomColorSubmit = () => {
    if (isValidHexColor(customColor)) {
      onChange(customColor);
      setCustomColor("");
      setShowCustomInput(false);
    }
  };

  const handleCustomColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCustomColorSubmit();
    } else if (e.key === "Escape") {
      setCustomColor("");
      setShowCustomInput(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => {
          const usedBy = usedColors?.get(color);
          const tooltipText = usedBy
            ? `Used by: ${usedBy.map((cat) => cat.name).join(", ")}`
            : color;

          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className="relative w-8 h-8 rounded-lg border-2 border-border hover:border-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
              style={{ backgroundColor: color }}
              title={tooltipText}
            >
              {value === color && (
                <Check
                  className="absolute inset-0 m-auto text-white drop-shadow-md"
                  size={16}
                />
              )}
              {/* Badge indicator for used colors */}
              {usedBy && usedBy.length === 1 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-surface-elevated rounded-full border-2 border-border flex items-center justify-center shadow-sm">
                  <CategoryIcon iconName={usedBy[0].iconName} className="w-2 h-2" color={color} />
                </div>
              )}
              {usedBy && usedBy.length > 1 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-surface-elevated rounded-full border-2 border-border flex items-center justify-center text-[8px] font-bold text-text-primary shadow-sm">
                  {usedBy.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <div className="space-y-2">
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="text-sm text-text-secondary hover:text-text-primary underline"
          >
            Use custom color
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
              onKeyDown={handleCustomColorKeyDown}
              placeholder="#3B82F6"
              maxLength={7}
              className="flex-1 px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-text-primary placeholder:text-text-secondary"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomColorSubmit}
              disabled={!isValidHexColor(customColor)}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomColor("");
                setShowCustomInput(false);
              }}
              className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Current Color Preview */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div
          className="w-10 h-10 rounded-lg border-2 border-border"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">Current color</div>
          <div className="text-xs text-text-secondary font-mono">{value}</div>
        </div>
      </div>
    </div>
  );
}
