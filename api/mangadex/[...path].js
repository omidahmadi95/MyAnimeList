import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path || '';

    const targetUrl = new URL(`https://api.mangadex.org/${pathStr}`);
    const incoming = new URL(req.url, `http://${req.headers.host}`);
    incoming.searchParams.forEach((value, key) => {
      if (key !== 'path') targetUrl.searchParams.append(key, value);
    });

    const { status, data } = await axios.get(targetUrl.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'my-anime-list/1.0 (https://my-anime-list-theta.vercel.app)',
      },
    });

    res.status(status).json(data);
  } catch (err) {
    const status = err.response?.status ?? 500;
    const data = err.response?.data ?? { error: err.message };
    res.status(status).json(data);
  }
}
