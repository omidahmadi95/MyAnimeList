export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';

  const targetUrl = new URL(`https://api.mangadex.org/${pathStr}`);
  const incoming = new URL(req.url, `http://${req.headers.host}`);
  incoming.searchParams.forEach((value, key) => {
    if (key !== 'path') targetUrl.searchParams.append(key, value);
  });

  const upstream = await fetch(targetUrl.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  const data = await upstream.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(upstream.status).json(data);
}
