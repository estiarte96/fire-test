import { createClient, kv } from '@vercel/kv';

const db = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  ? createClient({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : kv;

export default async function handler(request, response) {
  const { user } = request.query;
  
  if (!user) {
    return response.status(400).json({ error: 'User is required' });
  }

  try {
    const stats = await db.get(`stats_${user}`);
    return response.status(200).json(stats || {});
  } catch (error) {
    console.error('Database connection error:', error);
    return response.status(500).json({ error: error.message });
  }
}
