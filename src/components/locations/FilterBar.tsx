import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { DaySelector } from "./DaySelector";
import { CategoryFilter } from "./CategoryFilter";

type DetailViewMode = "map" | "calendar" | "kanban";

interface FilterBarProps {
  tripId: Id<"trips">;
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  categories: Doc<"categories">[] | undefined;
  visibleCategories: Set<Id<"categories">>;
  onToggleCategory: (categoryId: Id<"categories">) => void;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  detailViewMode?: DetailViewMode;
  onDetailViewModeChange?: (mode: DetailViewMode) => void;
}

export function FilterBar({
  tripId,
  selectedDate,
  onDateSelect,
  categories,
  visibleCategories,
  onToggleCategory,
  sidebarVisible,
  onToggleSidebar,
  detailViewMode,
  onDetailViewModeChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center bg-surface-secondary">
      {/* Sidebar toggle button (desktop only) */}
      {onToggleSidebar && (
        <div className="flex-shrink-0 flex items-center px-3 py-2 border-r border-border">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition"
            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarVisible ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18v16H3V4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l-2-2m0 0l2-2m-2 2h4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18v16H3V4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v16" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l2 2m0 0l-2 2m2-2H2" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Day selector takes up available space and can scroll */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <DaySelector
          tripId={tripId}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      </div>

      {/* Detail view mode toggle (desktop only) */}
      {onDetailViewModeChange && detailViewMode && (
        <div className="flex-shrink-0 flex items-center px-3 py-2 border-l border-border">
          <div className="flex items-center border border-border">
            <button
              onClick={() => onDetailViewModeChange("map")}
              className={`px-3 py-1.5 text-xs font-medium transition border-r border-border ${
                detailViewMode === "map" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => onDetailViewModeChange("calendar")}
              className={`px-3 py-1.5 text-xs font-medium transition border-r border-border ${
                detailViewMode === "calendar" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => onDetailViewModeChange("kanban")}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                detailViewMode === "kanban" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      )}

      {/* Separator and category filter on the right */}
      <div className="flex-shrink-0 flex items-center pl-3 pr-3 py-2 border-l border-border ml-0">
        <CategoryFilter
          categories={categories}
          visibleCategories={visibleCategories}
          onToggleCategory={onToggleCategory}
        />
      </div>
    </div>
  );
}
