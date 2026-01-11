import { useState } from "react";
import { X, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CategoryEditor } from "./CategoryEditor";
import { CategoryIcon } from "../../lib/typeIcons";
import { getCategoryBadgeStyle } from "../../lib/colorUtils";

interface CategoryManagementModalProps {
  tripId: Id<"trips">;
  onClose: () => void;
}

type EditorMode = "list" | "create" | "edit";

export function CategoryManagementModal({
  tripId,
  onClose,
}: CategoryManagementModalProps) {
  const [mode, setMode] = useState<EditorMode>("list");
  const [editingCategory, setEditingCategory] = useState<Doc<"categories"> | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Id<"categories"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useQuery(api.categories.list, { tripId });
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const handleCreate = async (data: {
    name: string;
    iconName: string;
    color: string;
  }) => {
    try {
      await createCategory({
        tripId,
        ...data,
      });
      setMode("list");
      setError(null);
    } catch (err) {
      throw err; // Let CategoryEditor handle the error display
    }
  };

  const handleUpdate = async (data: {
    name: string;
    iconName: string;
    color: string;
  }) => {
    if (!editingCategory) return;

    try {
      await updateCategory({
        id: editingCategory._id,
        ...data,
      });
      setMode("list");
      setEditingCategory(null);
      setError(null);
    } catch (err) {
      throw err; // Let CategoryEditor handle the error display
    }
  };

  const handleDelete = async (categoryId: Id<"categories">) => {
    setError(null);
    try {
      await removeCategory({ id: categoryId });
      setDeletingCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
      setDeletingCategory(null);
    }
  };

  const handleEdit = (category: Doc<"categories">) => {
    setEditingCategory(category);
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setMode("list");
    setEditingCategory(null);
    setError(null);
  };

  // Show editor when in create or edit mode
  if (mode === "create" || mode === "edit") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <CategoryEditor
          category={mode === "edit" ? editingCategory : null}
          onSave={mode === "edit" ? handleUpdate : handleCreate}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  // Show category list
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}

          {/* Add Category Button */}
          <button
            onClick={() => setMode("create")}
            className="w-full mb-4 px-4 py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:border-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Category
          </button>

          {/* Categories List */}
          <div className="space-y-2">
            {categories === undefined ? (
              <div className="text-center py-8 text-text-secondary">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No categories yet. Create one to get started!
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  {/* Icon and Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border border-border"
                      style={getCategoryBadgeStyle(category.color)}
                    >
                      <CategoryIcon
                        iconName={category.iconName}
                        className="w-5 h-5"
                        color={category.color}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {category.name}
                      </div>
                      {category.isDefault && (
                        <div className="text-xs text-text-secondary">Default</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/50"
                      title="Edit category"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category._id)}
                      className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/50"
                      title="Delete category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 bg-surface-elevated">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-lg max-w-md w-full p-6 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Delete Category
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete this category? This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-text-primary bg-surface-elevated border border-border rounded-lg hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingCategory)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
