import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/tickets.routes';
import commentsRouter from './routes/comments.routes';

const app = express();
app.disable('x-powered-by');

// 1. Security headers, then CORS allowlist (explicit origins only, no wildcard)
app.use(helmet());
app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS }));

// 2. Logging and body parsing
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/tickets/:ticketId/comments', commentsRouter);

// 4. 404 and the central error handler (always last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;