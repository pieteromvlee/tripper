import { useState, useEffect, useRef } from "react";

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchProps {
  onSelect: (result: LocationSearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [longitude, latitude]
  context?: Array<{ id: string; text: string }>;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

export function LocationSearch({
  onSelect,
  placeholder = "Search for a location...",
  autoFocus = false,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const encodedQuery = encodeURIComponent(query.trim());
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=8&types=poi,address,place,locality&fuzzyMatch=true`
        );

        if (!response.ok) {
          throw new Error("Geocoding request failed");
        }

        const data: MapboxResponse = await response.json();
        setResults(data.features || []);
        setIsOpen(data.features.length > 0);
      } catch (error) {
        console.error("Geocoding error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (feature: MapboxFeature) => {
    const [longitude, latitude] = feature.center;

    // Extract address from place_name (remove the place name itself if it's at the start)
    let address = feature.place_name;
    if (address.startsWith(feature.text)) {
      address = address.slice(feature.text.length).replace(/^,\s*/, "");
    }

    onSelect({
      name: feature.text,
      address: address || feature.place_name,
      latitude,
      longitude,
    });

    setQuery(feature.text);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
          {results.map((feature) => {
            // Parse address from place_name
            let displayAddress = feature.place_name;
            if (displayAddress.startsWith(feature.text)) {
              displayAddress = displayAddress
                .slice(feature.text.length)
                .replace(/^,\s*/, "");
            }

            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleSelect(feature)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 text-base">
                  {feature.text}
                </div>
                {displayAddress && (
                  <div className="text-sm text-gray-500 truncate">
                    {displayAddress}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
