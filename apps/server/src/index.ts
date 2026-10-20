import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initializeSocket } from './socket';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 Sangam Server running on http://${env.HOST}:${env.PORT}`);
  logger.info(`🔒 Security protocols initialized: DTLS-SRTP, AES-256-GCM, Rate Limits active`);
});
