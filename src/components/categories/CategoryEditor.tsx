import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { buildUsedColorsMap } from "../../lib/colorUtils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface CategoryEditorProps {
  category?: Doc<"categories"> | null;
  categories: Doc<"categories">[];
  onSave: (data: {
    name: string;
    iconName: string;
    color: string;
  }) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryEditor({
  category,
  categories,
  onSave,
  onCancel,
  isLoading = false,
}: CategoryEditorProps) {
  const [name, setName] = useState(category?.name || "");
  const [iconName, setIconName] = useState(category?.iconName || "Camera");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [error, setError] = useState<string | null>(null);

  // Compute which colors are used by other categories (excluding current category being edited)
  const usedColors = useMemo(
    () => buildUsedColorsMap(categories, category?._id),
    [categories, category?._id]
  );

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIconName(category.iconName);
      setColor(category.color);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Category name must be at least 2 characters");
      return;
    }

    if (name.trim().length > 30) {
      setError("Category name must be less than 30 characters");
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        iconName,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  return (
    <div
      className="bg-surface shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto border border-border"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-surface-secondary border-b border-border px-4 py-2 flex items-center justify-between z-10">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          {category ? "Edit Category" : "Create Category"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Category Name */}
        <div>
          <label
            htmlFor="category-name"
            className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide"
          >
            Category Name
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Museum, Beach, Park..."
            maxLength={30}
            className="w-full px-3 py-2 bg-surface-inset border border-border focus:outline-none focus:border-blue-400 text-sm text-text-primary placeholder:text-text-secondary"
            disabled={isLoading}
            autoFocus
          />
          <div className="mt-1 text-xs text-text-secondary">
            {name.trim().length}/30 characters
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
            Icon
          </label>
          <IconPicker value={iconName} onChange={setIconName} color={color} />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} usedColors={usedColors} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-text-secondary bg-surface-elevated border border-border hover:bg-surface hover:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white border border-blue-400 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
          >
            {isLoading ? "Saving..." : category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
