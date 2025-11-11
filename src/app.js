import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import 'express-async-errors';
import { setupSwagger } from './config/swagger.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Helmet with relaxed CSP for test client
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "cdn.socket.io"],
      "script-src-attr": ["'unsafe-inline'"],
      "connect-src": ["'self'", "cdn.socket.io"],
    },
  },
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files (for test client)
app.use(express.static(path.join(__dirname, '..')));

// Apply global rate limiter (skip chat endpoints for real-time usage)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/chat')) {
    return next(); // Skip rate limiting for chat
  }
  return generalLimiter(req, res, next);
});

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', message: 'EventHub API running' });
});

// Routes
app.use('/api', routes);

setupSwagger(app);

export default app;