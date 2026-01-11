import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AVAILABLE_ICONS } from "../../lib/typeIcons";
import { CategoryIcon } from "../../lib/typeIcons";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  color?: string;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  color = "#3B82F6",
  className = "",
}: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return AVAILABLE_ICONS;
    }

    const query = searchQuery.toLowerCase();
    return AVAILABLE_ICONS.filter((icon) =>
      icon.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary placeholder:text-text-secondary"
        />
      </div>

      {/* Icon Grid */}
      <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 bg-surface-elevated">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
          {filteredIcons.length > 0 ? (
            filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => onChange(iconName)}
                className={`
                  p-3 rounded-lg border-2 transition-all
                  hover:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-surface
                  ${
                    value === iconName
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border"
                  }
                `}
                title={iconName}
              >
                <CategoryIcon
                  iconName={iconName}
                  className="w-5 h-5 mx-auto"
                  color={value === iconName ? color : "#6B7280"}
                />
              </button>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-sm text-text-secondary">
              No icons found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Selected Icon Preview */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div
          className="w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center"
          style={{ backgroundColor: `${color}10` }}
        >
          <CategoryIcon iconName={value} className="w-6 h-6" color={color} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">
            Selected icon
          </div>
          <div className="text-xs text-text-secondary">{value}</div>
        </div>
      </div>
    </div>
  );
}
