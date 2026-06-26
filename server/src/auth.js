// Bearer-token gate. One shared token (API_TOKEN) protects every /api route.
// The tool sits behind Tailscale / Cloudflare Access in practice, so this is a
// second, simple layer rather than the only one.

const TOKEN = process.env.API_TOKEN || '';

export function requireToken(req, res, next) {
  if (!TOKEN) {
    // Fail closed: if the operator forgot to set a token, don't silently run open.
    return res.status(500).json({ error: 'API_TOKEN is not configured on the server.' });
  }
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (token !== TOKEN) {
    return res.status(401).json({ error: 'Invalid or missing token.' });
  }
  next();
}
