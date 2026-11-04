import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get("type") || "index";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const [locationsRes, propertiesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/uganda_locations?select=slug,level,region,district,name,is_active&eq=is_active.true`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/properties?select=id,status,district,area&eq=status.available`, { headers }),
    ]);
    const locations = await locationsRes.json();
    const properties = await propertiesRes.json();

    const baseUrl = "https://doorfinder.ug";
    const categories = ["houses-for-rent", "apartments", "hotels", "rentals", "guest-houses", "warehouses", "airbnb"];

    // Districts that actually have properties
    const districtsWithProps = new Set<string>();
    for (const p of properties) {
      if (p.district) districtsWithProps.add(p.district);
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

    if (sitemapType === "index") {
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      const sitemapTypes = ["locations", "category-pages", "property-listings"];
      for (const st of sitemapTypes) {
        xml += `  <sitemap><loc>${baseUrl}/functions/v1/da-dreamtech-sitemap?type=${st}</loc></sitemap>\n`;
      }
      xml += '</sitemapindex>';
    } else {
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      if (sitemapType === "property-listings") {
        for (const p of properties) {
          xml += `  <url><loc>${baseUrl}/?property=${p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
        }
      } else if (sitemapType === "category-pages") {
        const districts = locations.filter((l: any) => l.level === "district" && districtsWithProps.has(l.name));
        for (const d of districts) {
          for (const cat of categories) {
            xml += `  <url><loc>${baseUrl}/uganda/${d.slug}/${cat}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
          }
        }
      } else if (sitemapType === "locations") {
        // Only include locations at district level and above that have properties
        const districtLocations = locations.filter((l: any) =>
          l.level === "district" && districtsWithProps.has(l.name)
        );
        for (const l of districtLocations) {
          const path = buildPath(l);
          xml += `  <url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
        }
      }

      xml += '</urlset>';
    }

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Sitemap generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildPath(loc: any): string {
  const parts = ["uganda"];
  if (loc.region && loc.level !== "region") {
    parts.push(loc.region.toLowerCase().replace(/\s+/g, "-"));
  }
  if (loc.district && loc.level !== "district") {
    parts.push(loc.district.toLowerCase().replace(/\s+/g, "-"));
  }
  parts.push(loc.slug);
  return "/" + parts.join("/") + "/";
}
