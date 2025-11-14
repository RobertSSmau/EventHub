import { createServer } from 'http';
import { connectDB } from './src/config/db.js';
import { initRedis } from './src/config/redis.js';
import { initEmail } from './src/config/email.js';
import { connectMongoDB } from './src/config/mongodb.js';
import { initSocketIO } from './src/config/socket.js';
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
    
    // Create HTTP server for Socket.IO
    const server = createServer(app);
    
    // Connect to databases
    await connectDB();
    await connectMongoDB();
    
    // Initialize Socket.IO for chat
    initSocketIO(server);
    
    // Initialize email service
    await initEmail();
    
    // Start server only after all services are ready
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Socket.IO ready for chat connections`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();