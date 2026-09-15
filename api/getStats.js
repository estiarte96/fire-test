import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  const { user } = request.query;
  
  if (!user) {
    return response.status(400).json({ error: 'User is required' });
  }

  try {
    const stats = await kv.get(`stats_${user}`);
    return response.status(200).json(stats || {});
  } catch (error) {
    // If KV is not configured, it will throw. Return empty object as fallback.
    return response.status(200).json({});
  }
}
