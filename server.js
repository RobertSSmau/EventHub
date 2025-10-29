import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv-safe';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();