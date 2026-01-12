import { LocationSearch } from "./LocationSearch";

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchBarProps {
  show: boolean;
  onClose: () => void;
  onSelect: (result: LocationSearchResult) => void;
  variant: "inline" | "floating";
  proximity?: { lat: number; lng: number } | null;
}

export function LocationSearchBar({
  show,
  onClose,
  onSelect,
  variant,
  proximity,
}: LocationSearchBarProps) {
  if (!show) return null;

  const containerClass =
    variant === "floating"
      ? "absolute top-3 left-3 right-3 z-10"
      : "p-3 border-b border-border bg-surface-secondary";

  const innerClass =
    variant === "floating"
      ? "flex items-center gap-2 bg-surface-elevated border border-border p-2"
      : "flex items-center gap-2";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        <div className="flex-1">
          <LocationSearch
            onSelect={onSelect}
            placeholder="Search for a place..."
            autoFocus
            proximity={proximity}
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-elevated border border-transparent hover:border-border"
          title="Cancel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
