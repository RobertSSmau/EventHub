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
import passport from './config/passport.js';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy - IMPORTANTE per Render (proxy reverse)
app.set('trust proxy', 1);

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

// CORS configuration with credentials support
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Validate critical environment variables
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production environment');
}

// Session middleware (required for Passport OAuth)
// Create a separate Redis client for sessions using the standard redis package
let redisSessionClient;
try {
  redisSessionClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisSessionClient.connect();
  console.log('Connected to Redis for sessions');
} catch (error) {
  console.warn('Failed to connect to Redis for sessions:', error.message);
}

const sessionConfig = {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use Redis as session store if available, otherwise fallback to MemoryStore
if (redisSessionClient) {
  sessionConfig.store = new RedisStore({
    client: redisSessionClient,
    prefix: 'session:'
  });
  console.log('Using Redis as session store');
} else {
  console.warn('Redis not available, using MemoryStore for sessions (not recommended for production)');
}

app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (for test client)
app.use(express.static(path.join(__dirname, '..')));

// Apply global rate limiter (skip chat endpoints for real-time usage)
// Disable in development mode to allow frequent testing
if (process.env.NODE_ENV === 'production') {
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/chat')) {
      return next(); // Skip rate limiting for chat
    }
    return generalLimiter(req, res, next);
  });
}

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', message: 'EventHub API running' });
});

// Routes
app.use('/api', routes);

setupSwagger(app);

export default app;