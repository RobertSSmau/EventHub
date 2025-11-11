import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initRedis } from './src/config/redis.js';
import { initEmail } from './src/config/email.js';
import dotenv from 'dotenv-safe';
import { User } from './src/models/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    initRedis();
    await initEmail();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();