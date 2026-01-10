import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

// Allowed origins for CORS (production and development)
const ALLOWED_ORIGINS = [
  "https://tripper.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
  };
}

// Foursquare Places API proxy (to avoid CORS issues)
http.route({
  path: "/api/foursquare/places",
  method: "GET",
  handler: httpAction(async (_, request) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const ll = url.searchParams.get("ll");
    const limit = url.searchParams.get("limit") || "5";

    // Validate query parameter
    if (!query) {
      return new Response(JSON.stringify({ error: "query parameter required" }), {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }
    if (query.length < 2) {
      return new Response(JSON.stringify({ error: "Query too short (min 2 characters)" }), {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }
    if (query.length > 200) {
      return new Response(JSON.stringify({ error: "Query too long (max 200 characters)" }), {
        status: 400,
        headers: getCorsHeaders(request),
      });
    }

    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Foursquare API key not configured" }), {
        status: 500,
        headers: getCorsHeaders(request),
      });
    }

    const fsqUrl = new URL("https://places-api.foursquare.com/places/search");
    fsqUrl.searchParams.set("query", query);
    fsqUrl.searchParams.set("limit", limit);
    if (ll) fsqUrl.searchParams.set("ll", ll);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(fsqUrl.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Places-Api-Version": "2025-06-17",
        },
        signal: controller.signal,
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: getCorsHeaders(request),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return new Response(JSON.stringify({ error: "Request timeout" }), {
          status: 504,
          headers: getCorsHeaders(request),
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }),
});

export default http;
