/**
 * MPS Studio - Gemini API Proxy
 * Deploy this to Cloudflare Workers (free tier: 100,000 req/day)
 * 
 * Setup:
 * 1. Go to https://workers.cloudflare.com → sign up free
 * 2. Create new Worker → paste this code
 * 3. Add environment variable: GEMINI_API_KEY = your AQ. key
 * 4. Deploy → copy your worker URL (e.g. https://mps-gemini.yourname.workers.dev)
 * 5. Update PROXY_URL in js/gemini-chat.js with that URL
 */

export default {
  async fetch(request, env) {

    // Allow CORS from your website
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const GEMINI_KEY = env.GEMINI_API_KEY;
      const MODEL = 'gemini-2.0-flash';
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

      const geminiRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + GEMINI_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await geminiRes.json();

      return new Response(JSON.stringify(data), {
        status: geminiRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};
