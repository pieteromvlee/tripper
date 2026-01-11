import { useState, useEffect, useRef } from "react";

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  suggestedCategoryName?: string;
}

interface LocationSearchProps {
  onSelect: (result: LocationSearchResult) => void;
  placeholder?: string;
  autoFocus?: boolean;
  proximity?: { lat: number; lng: number } | null;
}

// Unified search result from either source
interface SearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: "foursquare" | "mapbox";
  suggestedCategoryName?: string;
}

// Map Foursquare category to category name
function inferCategoryName(categories: Array<{ name: string }>): string | undefined {
  const categoryNames = categories.map((c) => c.name.toLowerCase()).join(" ");

  // Check for accommodation/lodging
  if (/hotel|motel|hostel|lodging|inn|resort|bed & breakfast|airbnb|vacation rental|guest house|apartment|villa/i.test(categoryNames)) {
    return "Accommodation";
  }

  // Check for shop/retail
  if (/shop|store|market|boutique|mall|retail|supermarket|grocery|pharmacy|bookstore|clothing|fashion|gift|souvenir/i.test(categoryNames)) {
    return "Shop";
  }

  // Check for snack/café (coffee, bakery, ice cream, dessert, tea)
  if (/café|cafe|coffee|bakery|ice cream|dessert|pastry|patisserie|snack|tea house|gelato|frozen yogurt|donut|cupcake|juice|smoothie/i.test(categoryNames)) {
    return "Snack";
  }

  // Check for restaurant/food (full meals)
  if (/restaurant|food|bar|pub|bistro|diner|eatery|pizza|burger|sushi|steakhouse|seafood|breakfast|brunch|lunch|dinner|grill|kitchen|tavern|cantina|trattoria|osteria|brasserie/i.test(categoryNames)) {
    return "Restaurant";
  }

  // Default to attraction
  return "Attraction";
}

// Foursquare API types (new Places API format)
interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  location: {
    formatted_address?: string;
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  categories?: Array<{ name: string }>;
}

interface FoursquareResponse {
  results: FoursquarePlace[];
}

// Mapbox API types
interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

interface MapboxResponse {
  features: MapboxFeature[];
}

export function LocationSearch({
  onSelect,
  placeholder = "Search for a location...",
  autoFocus = false,
  proximity,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - calls both APIs in parallel
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
        const encodedQuery = encodeURIComponent(query.trim());

        // Build API calls
        const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site");
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

        const llParam = proximity ? `&ll=${proximity.lat},${proximity.lng}` : "";
        const proximityParam = proximity ? `&proximity=${proximity.lng},${proximity.lat}` : "";

        // Parallel API calls
        const [foursquareRes, mapboxRes] = await Promise.allSettled([
          // Foursquare via Convex proxy (to avoid CORS)
          convexUrl
            ? fetch(
                `${convexUrl}/api/foursquare/places?query=${encodedQuery}${llParam}&limit=5`
              )
            : Promise.reject("No Convex URL configured"),
          // Mapbox - good for addresses and places
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5&types=poi,address,place,locality&fuzzyMatch=true${proximityParam}`
          ),
        ]);

        const combinedResults: SearchResult[] = [];
        const seenLocations = new Set<string>();

        // Process Foursquare results first (better for businesses)
        if (foursquareRes.status === "fulfilled" && foursquareRes.value.ok) {
          const data: FoursquareResponse = await foursquareRes.value.json();
          for (const place of data.results || []) {
            const locKey = `${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`;
            if (!seenLocations.has(locKey)) {
              seenLocations.add(locKey);
              const loc = place.location;
              const address = loc.formatted_address ||
                [loc.address, loc.locality, loc.region, loc.country].filter(Boolean).join(", ");
              combinedResults.push({
                id: `fsq-${place.fsq_place_id}`,
                name: place.name,
                address,
                latitude: place.latitude,
                longitude: place.longitude,
                source: "foursquare",
                suggestedCategoryName: place.categories ? inferCategoryName(place.categories) : undefined,
              });
            }
          }
        }

        // Process Mapbox results
        if (mapboxRes.status === "fulfilled" && mapboxRes.value.ok) {
          const data: MapboxResponse = await mapboxRes.value.json();
          for (const feature of data.features || []) {
            const [lng, lat] = feature.center;
            const locKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
            if (!seenLocations.has(locKey)) {
              seenLocations.add(locKey);
              let address = feature.place_name;
              if (address.startsWith(feature.text)) {
                address = address.slice(feature.text.length).replace(/^,\s*/, "");
              }
              combinedResults.push({
                id: `mb-${feature.id}`,
                name: feature.text,
                address: address || feature.place_name,
                latitude: lat,
                longitude: lng,
                source: "mapbox",
              });
            }
          }
        }

        setResults(combinedResults);
        setIsOpen(combinedResults.length > 0);
      } catch (error) {
        console.error("Search error:", error);
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
  }, [query, proximity]);

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

  const handleSelect = (result: SearchResult) => {
    onSelect({
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      suggestedCategoryName: result.suggestedCategoryName,
    });

    setQuery(result.name);
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
            className="h-4 w-4 text-text-muted"
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
          className="w-full pl-9 pr-9 py-2 border border-border bg-surface-inset text-sm focus:outline-none focus:border-blue-400"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-text-muted"
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
              className="text-text-muted hover:text-text-secondary focus:outline-none"
            >
              <svg
                className="h-4 w-4"
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
        <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-border max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-3 py-2 text-left hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none border-b border-border-muted last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary text-sm">
                  {result.name}
                </span>
                {result.suggestedCategoryName && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/50">
                    {result.suggestedCategoryName.toLowerCase()}
                  </span>
                )}
              </div>
              {result.address && (
                <div className="text-xs text-text-muted truncate">
                  {result.address}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
