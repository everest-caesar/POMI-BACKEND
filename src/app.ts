import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import apiRoutes from './routes/index';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API v1 Routes
app.use('/api/v1', apiRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`\n🍎 Pomi API Server Running`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
  });
}

export default app;
