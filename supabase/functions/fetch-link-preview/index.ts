const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractMeta(html: string, property: string): string | null {
  // Try og: property first
  const ogRegex = new RegExp(
    `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
    'i'
  );
  let match = html.match(ogRegex);
  if (match) return match[1];

  // Try reverse order (content before property)
  const ogRegex2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
    'i'
  );
  match = html.match(ogRegex2);
  if (match) return match[1];

  return null;
}

function extractFallbackTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractFallbackDescription(html: string): string | null {
  const regex = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i;
  let match = html.match(regex);
  if (match) return match[1];

  const regex2 = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i;
  match = html.match(regex2);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Fetching preview for:', formattedUrl);

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    const title = extractMeta(html, 'title') || extractFallbackTitle(html) || '';
    const description = extractMeta(html, 'description') || extractFallbackDescription(html) || '';
    let image = extractMeta(html, 'image') || '';

    // Make relative image URLs absolute
    if (image && !image.startsWith('http')) {
      try {
        const base = new URL(formattedUrl);
        image = new URL(image, base.origin).toString();
      } catch {}
    }

    console.log('Preview extracted:', { title, description: description.substring(0, 50), image });

    return new Response(
      JSON.stringify({ title, description, image }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching preview:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch preview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
