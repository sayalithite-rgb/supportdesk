import express from 'express';
import { disconnectDatabase } from './repositories/prisma';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health.routes';
import ticketRoutes from './routes/tickets.routes';

const app = express();

app.disable('x-powered-by');

// Core Middlewares
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/tickets', ticketRoutes);
app.use(notFoundHandler);

// Central Error Handling (Must be registered after routes)
app.use(errorHandler);

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default app;