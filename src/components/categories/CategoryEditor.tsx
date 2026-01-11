import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import type { Doc } from "../../../convex/_generated/dataModel";

interface CategoryEditorProps {
  category?: Doc<"categories"> | null;
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
  onSave,
  onCancel,
  isLoading = false,
}: CategoryEditorProps) {
  const [name, setName] = useState(category?.name || "");
  const [iconName, setIconName] = useState(category?.iconName || "Camera");
  const [color, setColor] = useState(category?.color || "#3B82F6");
  const [error, setError] = useState<string | null>(null);

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
    <div className="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
      {/* Header */}
      <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <h2 className="text-xl font-semibold text-text-primary">
          {category ? "Edit Category" : "Create Category"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Category Name */}
        <div>
          <label
            htmlFor="category-name"
            className="block text-sm font-medium text-text-primary mb-2"
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
            className="w-full px-4 py-2 bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-text-primary placeholder:text-text-secondary"
            disabled={isLoading}
            autoFocus
          />
          <div className="mt-1 text-xs text-text-secondary">
            {name.trim().length}/30 characters
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Icon
          </label>
          <IconPicker value={iconName} onChange={setIconName} color={color} />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-text-primary bg-surface-elevated border border-border rounded-lg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
