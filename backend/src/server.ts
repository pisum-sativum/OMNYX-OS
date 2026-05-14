import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { aiRoutes } from './routes/ai';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[OMNYX] ANTHROPIC_API_KEY not set. Aborting.');
  process.exit(1);
}

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);

server.register(cors, {
  origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS rejected'), false);
    }
  },
  methods: ['GET', 'POST'],
});

server.register(aiRoutes);

const PORT = parseInt(process.env.PORT ?? '3001', 10);

server.listen({ port: PORT, host: '0.0.0.0' }, (err: Error | null) => {
  if (err) { server.log.error(err); process.exit(1); }
  server.log.info(`OMNYX AI Backend operational on port ${PORT}`);
});
