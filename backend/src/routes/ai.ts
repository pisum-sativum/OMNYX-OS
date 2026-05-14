import { FastifyInstance } from 'fastify';
import { AnalyzeRequestSchema } from '../validators/aiSchemas';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { analyzeThreaat } from '../services/llm';
import { randomUUID } from 'crypto';

export async function aiRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ai/analyze', async (req, reply) => {
    // Parse and validate input
    const parseResult = AnalyzeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const validatedBody = parseResult.data;

    // Apply rate limiting
    const typedReq = req as typeof req & { body: { deviceId?: string } };
    typedReq.body = validatedBody;
    await rateLimitMiddleware(typedReq, reply);
    if (reply.sent) return;

    try {
      const analysis = await analyzeThreaat(validatedBody);
      return reply.send({
        success: true,
        data: analysis,
        requestId: randomUUID(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      fastify.log.error({ err }, 'AI analysis failed');
      return reply.code(500).send({
        success: false,
        error: 'Analysis unavailable',
        message,
      });
    }
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'operational', version: '1.0.0' }));
}
