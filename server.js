import { connectDB } from './src/config/db.js';
import { initRedis } from './src/config/redis.js';
import { initEmail } from './src/config/email.js';
import dotenv from 'dotenv-safe';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Initialize Redis FIRST, before importing app
    console.log('Initializing Redis...');
    await initRedis();
    
    // Now import app (which will create middleware with Redis store)
    const { default: app } = await import('./src/app.js');
    
    // Connect to database
    await connectDB();
    
    // Initialize email service
    await initEmail();
    
    // Start server only after all services are ready
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();