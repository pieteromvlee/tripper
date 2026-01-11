import { useState } from "react";
import { createPortal } from "react-dom";
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only close if clicking the backdrop itself, not the content
    if (e.target === e.currentTarget) {
      if (mode === "list") {
        onClose();
      } else {
        handleCancelEdit();
      }
    }
  };

  // Show editor when in create or edit mode
  if (mode === "create" || mode === "edit") {
    return createPortal(
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <CategoryEditor
          category={mode === "edit" ? editingCategory : null}
          categories={categories || []}
          onSave={mode === "edit" ? handleUpdate : handleCreate}
          onCancel={handleCancelEdit}
        />
      </div>,
      document.body
    );
  }

  // Show category list
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-surface shadow-lg max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-surface-secondary border-b border-border px-2 py-1 flex items-center justify-between">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wide">
            CATEGORIES
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Error Message */}
          {error && (
            <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/50 flex items-start gap-1.5">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={12} />
              <div className="text-[10px] text-red-400">{error}</div>
            </div>
          )}

          {/* Add Category Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode("create");
            }}
            className="w-full mb-2 px-2 py-1 border border-dashed border-border text-text-secondary hover:border-text-primary hover:text-text-primary hover:bg-surface-elevated flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide font-medium"
          >
            <Plus size={12} />
            ADD
          </button>

          {/* Categories List */}
          <div className="border border-border">
            {categories === undefined ? (
              <div className="text-center py-4 text-text-secondary text-[10px]">
                LOADING...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-4 text-text-secondary text-[10px]">
                NO CATEGORIES
              </div>
            ) : (
              categories.map((category, index) => (
                <div
                  key={category._id}
                  className={`flex items-center gap-2 p-1.5 hover:bg-surface-elevated ${
                    index < categories.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {/* Icon and Name */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div
                      className="w-6 h-6 flex items-center justify-center flex-shrink-0 border"
                      style={getCategoryBadgeStyle(category.color)}
                    >
                      <CategoryIcon
                        iconName={category.iconName}
                        className="w-3 h-3"
                        color={category.color}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <div className="font-medium text-text-primary text-xs truncate">
                        {category.name}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(category);
                      }}
                      className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCategory(category._id);
                      }}
                      className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deletingCategory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              setDeletingCategory(null);
            }
          }}
        >
          <div
            className="bg-surface shadow-lg max-w-sm w-full border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-secondary border-b border-border px-2 py-1">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                DELETE CATEGORY
              </h3>
            </div>
            <div className="p-2">
              <p className="text-text-secondary text-xs mb-3">
                Delete this category? Cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCategory(null);
                  }}
                  className="px-2 py-1 text-text-primary bg-surface-elevated border border-border hover:bg-surface text-[10px] uppercase tracking-wide font-medium"
                >
                  CANCEL
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(deletingCategory);
                  }}
                  className="px-2 py-1 bg-red-600 text-white border border-red-400 hover:bg-red-500 text-[10px] uppercase tracking-wide font-medium"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
