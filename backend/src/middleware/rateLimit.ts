import { FastifyRequest, FastifyReply } from 'fastify';

interface DeviceRecord {
  count: number;
  windowStart: number;
  lastRequest: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 20;
const COOLDOWN_MS = 30 * 1000; // 30 seconds between requests

const deviceMap = new Map<string, DeviceRecord>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, record] of deviceMap.entries()) {
    if (record.windowStart < cutoff) deviceMap.delete(key);
  }
}, 10 * 60 * 1000);

export async function rateLimitMiddleware(
  req: FastifyRequest<{ Body: { deviceId?: string } }>,
  reply: FastifyReply
): Promise<void> {
  const deviceId = req.body?.deviceId;
  if (!deviceId) {
    reply.code(400).send({ success: false, error: 'Missing deviceId' });
    return;
  }

  const now = Date.now();
  const record = deviceMap.get(deviceId);

  if (!record) {
    deviceMap.set(deviceId, { count: 1, windowStart: now, lastRequest: now });
    return;
  }

  // Reset window if expired
  if (now - record.windowStart > WINDOW_MS) {
    deviceMap.set(deviceId, { count: 1, windowStart: now, lastRequest: now });
    return;
  }

  // Cooldown check
  if (now - record.lastRequest < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - record.lastRequest)) / 1000);
    reply.code(429).send({
      success: false,
      error: 'Analysis cooldown active',
      retryAfter,
    });
    return;
  }

  // Window limit check
  if (record.count >= MAX_PER_WINDOW) {
    const resetIn = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 60000);
    reply.code(429).send({
      success: false,
      error: 'Rate limit exceeded',
      resetInMinutes: resetIn,
    });
    return;
  }

  record.count++;
  record.lastRequest = now;
}
