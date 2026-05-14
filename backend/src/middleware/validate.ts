import type { FastifyRequest, FastifyReply } from 'fastify';

const MAX_BODY_BYTES = 8 * 1024;

export async function validateMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ct = req.headers['content-type'] ?? '';
  if (!ct.includes('application/json')) {
    await reply.code(415).send({ success: false, error: 'Expected application/json' });
    return;
  }

  const bodyStr = JSON.stringify(req.body ?? '');
  if (Buffer.byteLength(bodyStr, 'utf8') > MAX_BODY_BYTES) {
    await reply.code(413).send({ success: false, error: 'Request body too large' });
    return;
  }
}
