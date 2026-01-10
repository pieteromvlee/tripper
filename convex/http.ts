import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

// Foursquare Places API proxy (to avoid CORS issues)
http.route({
  path: "/api/foursquare/places",
  method: "GET",
  handler: httpAction(async (_, request) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const ll = url.searchParams.get("ll");
    const limit = url.searchParams.get("limit") || "5";

    if (!query) {
      return new Response(JSON.stringify({ error: "query parameter required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Foursquare API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fsqUrl = new URL("https://places-api.foursquare.com/places/search");
    fsqUrl.searchParams.set("query", query);
    fsqUrl.searchParams.set("limit", limit);
    if (ll) fsqUrl.searchParams.set("ll", ll);

    const response = await fetch(fsqUrl.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": "2025-06-17",
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
