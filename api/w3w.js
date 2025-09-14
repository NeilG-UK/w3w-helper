// Vercel Serverless Function
// GET /api/w3w?words=index.home.raft
export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const apiKey = process.env.W3W_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server missing W3W_API_KEY' });

    const words =
      (req.method === 'GET'
        ? (req.query.words || req.query.w || '').toString()
        : (req.body && (req.body.words || req.body.w)) || '');

    const normalized = (words || '')
      .trim()
      .replace(/^\/+/, '')
      .replace(/^w3w:\/\//, '')
      .replace(/^https?:\/\/.*\/([^.]+\.[^.]+\.[^.]+).*$/, '$1')
      .toLowerCase();

    const W3W_RE = /^[a-z]+(?:-[a-z]+)*\.[a-z]+(?:-[a-z]+)*\.[a-z]+(?:-[a-z]+)*$/;
    if (!normalized || !W3W_RE.test(normalized)) {
      return res.status(400).json({ error: 'Invalid what3words format', example: 'index.home.raft' });
    }

    const url = new URL('https://api.what3words.com/v3/convert-to-coordinates');
    url.searchParams.set('words', normalized);
    url.searchParams.set('key', apiKey);

    const upstream = await fetch(url.toString(), { method: 'GET' });
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'what3words API error', details: data });
    }

    const { coordinates, nearestPlace, language, map } = data || {};
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(502).json({ error: 'Unexpected what3words response', details: data });
    }

    return res.status(200).json({
      words: normalized,
      lat: coordinates.lat,
      lng: coordinates.lng,
      nearestPlace: nearestPlace || null,
      language: language || null,
      map: map || null,
      source: 'what3words'
    });
  } catch (err) {
    console.error('w3w helper error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
