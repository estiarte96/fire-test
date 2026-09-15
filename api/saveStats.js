import { createClient, kv } from '@vercel/kv';

const db = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  ? createClient({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : kv;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { user, stats } = request.body;

  if (!user || !stats) {
    return response.status(400).json({ error: 'User and stats are required' });
  }

  try {
    await db.set(`stats_${user}`, stats);
    return response.status(200).json({ success: true });
  } catch (error) {
    // Fail silently if KV is not configured properly in dev
    return response.status(500).json({ error: error.message });
  }
}
