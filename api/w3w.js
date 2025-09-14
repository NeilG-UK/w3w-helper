// File: api/w3w.js

export default async function handler(req, res) {
  const { words, country, focus } = req.query;

  if (!words || typeof words !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "words" query parameter' });
  }

  const w3wKey = process.env.W3W_API_KEY;
  if (!w3wKey) {
    return res.status(500).json({ error: 'Missing W3W_API_KEY in environment' });
  }

  const searchParams = new URLSearchParams({
    words: words.replace(/^\/+/, ''), // strip leading slashes if present
    key: w3wKey,
  });

  if (country) {
    searchParams.set('clip-to-country', country);
  }

  if (focus) {
    const coords = focus.split(',');
    if (coords.length === 2) {
      searchParams.set('focus', focus);
    }
  }

  const apiUrl = `https://api.what3words.com/v3/convert-to-coordinates?${searchParams.toString()}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({
      lat: data.coordinates.lat,
      lng: data.coordinates.lng,
      nearestPlace: data.nearestPlace,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to contact what3words API', details: err.message });
  }
}
