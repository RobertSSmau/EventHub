import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import 'express-async-errors';
import { setupSwagger } from './config/swagger.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', message: 'EventHub API running' });
});

// Routes
app.use('/api', routes);

setupSwagger(app);

export default app;