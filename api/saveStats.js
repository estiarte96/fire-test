import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { user, stats } = request.body;

  if (!user || !stats) {
    return response.status(400).json({ error: 'User and stats are required' });
  }

  try {
    await kv.set(`stats_${user}`, stats);
    return response.status(200).json({ success: true });
  } catch (error) {
    // Fail silently if KV is not configured properly in dev
    return response.status(500).json({ error: error.message });
  }
}
